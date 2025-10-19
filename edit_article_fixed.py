"""
Fixed edit-article endpoint with consistent error handling
"""

@app.route('/edit-article/<article_id>', methods=['PUT'])
def edit_article(article_id):
    if request.content_length > 10 * 1024 * 1024:  # 10MB limit
        return jsonify({"status": "error", "error": {"code": 413, "message": "Payload too large"}}), 413
        
    session_token = re.sub(r'[^a-zA-Z0-9-_]', '', str(request.headers.get('Session-Token', '')))
    subject = re.sub(r'[^a-zA-Z0-9\s\-_.]', '', str(request.form.get('subject', '')))
    body = str(request.form.get('body', ''))
    image_data_list = request.files.getlist('image_data')
    delete_images = request.form.getlist('delete_image_ids')  # Image IDs to delete
    replace_all = request.form.get('replace_all', 'false').lower() == 'true'  # Whether to replace all images
    
    if not ObjectId.is_valid(article_id):
        return jsonify({"status": "error", "error": {"code": 400, "message": "Invalid article ID"}}), 400
        
    # FIX: Check if session token is provided
    if not session_token:
        return jsonify({"status": "error", "error": {"code": 401, "message": "Session token required"}}), 401
        
    user = users.find_one({"sessions.token": session_token})
    if not user:
        # FIX: Return consistent error format
        return jsonify({"status": "error", "error": {"code": 401, "message": "Invalid session. Please log in again"}}), 401
        
    article = articles.find_one({"_id": ObjectId(article_id), "user_id": user['_id']})
    if not article:
        return jsonify({"status": "error", "error": {"code": 404, "message": "Article not found or not owned by user"}}), 404
        
    update_fields = {}
    
    if subject:
        update_fields['subject'] = subject
        
    if body:
        invalid_tags = ['<script', '</script>', '<iframe', '</iframe>', '<embed', '</embed>', '<object', '</object>']
        if any(tag in body for tag in invalid_tags):
            return jsonify({"status": "error", "error": {"code": 400, "message": "Security error: Potentially dangerous content detected in body"}}), 400
        update_fields['body'] = body
    
    # Handle images
    current_images = article.get('images', [])
    new_images = []
    
    try:
        # Handle image deletions
        if delete_images:
            # Validate that all delete_image_ids exist in current images
            current_image_ids = {img['id'] for img in current_images}
            invalid_ids = [id for id in delete_images if id not in current_image_ids]
            if invalid_ids:
                return jsonify({"status": "error", "error": {"code": 400, "message": f"Invalid image IDs: {invalid_ids}"}}), 400
            
            # Delete specified images from storage
            for image_id in delete_images:
                delete_image(image_id)
                
            # Remove deleted images from current_images
            current_images = [img for img in current_images if img['id'] not in delete_images]
        
        # Handle new image uploads
        if image_data_list:
            # Check size limits
            total_size = sum(image.content_length or 0 for image in image_data_list)
            if total_size > 20 * 1024 * 1024:  # 20 MB total limit
                return jsonify({"status": "error", "error": {"code": 413, "message": "Total image size exceeds the 20 MB limit"}}), 413
            
            for image in image_data_list:
                if image.content_length > 5 * 1024 * 1024:  # 5 MB per image
                    return jsonify({"status": "error", "error": {"code": 413, "message": "Individual image size exceeds the 5 MB limit"}}), 413
            
            # Upload new images
            image_response = upload_image(image_data_list, user.get("email"))
            if not image_response.get('success'):
                # FIX: Return consistent error format
                error_code = 403 if "exceed" in image_response.get('message', '') else 500
                return jsonify({"status": "error", "error": {"code": error_code, "message": image_response.get('message', 'Failed to upload images')}}), error_code
            
            # Process upload response
            if len(image_data_list) == 1:
                new_images = [{
                    "url": image_response['result']['url'],
                    "id": image_response['result']['id']
                }]
            else:
                new_images = [{
                    "url": img['url'],
                    "id": img['id']
                } for img in image_response['results']]
        
        # Determine final image list based on replace_all flag
        if replace_all and image_data_list:
            # Delete all existing images
            for img in current_images:
                delete_image(img['id'])
            final_images = new_images
        else:
            final_images = current_images + new_images
        
        if final_images or delete_images or replace_all:
            update_fields['images'] = final_images
            
    except Exception as e:
        # Cleanup any newly uploaded images if there's an error
        for img in new_images:
            delete_image(img['id'])
        # FIX: Return consistent error format
        return jsonify({"status": "error", "error": {"code": 500, "message": f"Error processing images: {str(e)}"}}), 500
            
    if not update_fields:
        return jsonify({"status": "error", "error": {"code": 400, "message": "No fields to update"}}), 400
        
    # FIX: Add error handling for database update
    try:
        result = articles.update_one(
            {"_id": ObjectId(article_id), "user_id": user['_id']},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            return jsonify({"status": "error", "error": {"code": 500, "message": "Failed to update article"}}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "error": {"code": 500, "message": f"Database error: {str(e)}"}}), 500
    
    # Success response - no changes needed here
    return jsonify({
        "status": "success", 
        "code": 200, 
        "data": {
            "article_id": str(article_id),
            "subject": update_fields.get("subject", article.get("subject")),
            "url": article.get("url"),
            "body": update_fields.get("body", article.get("body")),
            "message": "Article updated successfully",
            "images": [img["url"] for img in final_images] if 'images' in update_fields else None
        }
    }), 200


"""
Key fixes made:

1. **Consistent Error Format**: All error responses now use the same structure:
   {"status": "error", "error": {"code": xxx, "message": "..."}}
   
2. **Session Token Validation**: Added a check to ensure session token is provided before querying the database

3. **Better Error Messages**: Made error messages more consistent and informative

4. **Database Update Error Handling**: Added try-catch block around the database update and check if the update was successful

5. **Exception Handling**: Improved exception handling with proper error format

6. **Image Processing Errors**: Consistent error handling for image upload failures

The main issue was that different parts of the code were using different error response structures:
- Some used: {"status": "error", "code": xxx, "data": {"message": "..."}}
- Others used: {"status": "error", "error": {"code": xxx, "message": "..."}}

The frontend is expecting the second format, so I've standardized all errors to use that format.
"""