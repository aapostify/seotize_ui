// Images Section with Complete Implementation
async function loadImages(page = 1) {
    try {
        paginationState.images.page = page;
        const { data, pagination } = await api(`/images/dashboard?page=${page}&page_size=${paginationState.images.pageSize}`);
        
        currentData.images = data.images || [];
        paginationState.images.total = pagination?.total || 0;
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="ri-image-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.uploaded || 0}</div>
                    <div class="stat-label">Images Uploaded</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="ri-database-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.remaining || 0}</div>
                    <div class="stat-label">Remaining Quota</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="ri-vip-crown-line"></i>
                    </div>
                    <div class="stat-value">${(data.user?.plan || 'free').toUpperCase()}</div>
                    <div class="stat-label">Current Plan</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="ri-calendar-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.expiry_date ? new Date(data.user.expiry_date).toLocaleDateString() : 'Never'}</div>
                    <div class="stat-label">Plan Expires</div>
                </div>
            </div>
            
            <!-- Actions Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>Image Library</h2>
                <button class="btn btn-primary" onclick="showImageUploadModal()">
                    <i class="ri-upload-cloud-line"></i> Upload Images
                </button>
            </div>
            
            <!-- Images Grid -->
            ${currentData.images.length > 0 ? `
                <div class="image-grid">
                    ${currentData.images.map(img => {
                        const totalViews = img.total_views || 0;
                        const monthlyStats = img.monthly_stats || {};
                        const formats = Object.keys(img.formats || {});
                        
                        return `
                            <div class="image-card">
                                <div class="image-preview">
                                    <img src="${img.cdn_url}" alt="${img.original_filename}" loading="lazy">
                                </div>
                                <div class="image-info">
                                    <div class="image-title" title="${img.original_filename}">${img.original_filename}</div>
                                    <div class="image-meta">
                                        <span><i class="ri-eye-line"></i> ${totalViews}</span>
                                        <span>${new Date(img.upload_date).toLocaleDateString()}</span>
                                    </div>
                                    ${formats.length > 0 ? `
                                        <div style="margin: 0.5rem 0;">
                                            ${formats.map(format => `
                                                <span class="badge badge-info" style="font-size: 0.7rem;">${format.toUpperCase()}</span>
                                            `).join(' ')}
                                        </div>
                                    ` : ''}
                                    <div class="image-actions">
                                        <button class="btn btn-sm btn-secondary" onclick="copyImageUrl('${img.cdn_url}')">
                                            <i class="ri-clipboard-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="viewImageStats('${img.image_id}')">
                                            <i class="ri-bar-chart-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteImage('${img.image_id}')">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${renderPagination('images', paginationState.images, loadImages)}
            ` : `
                <div class="empty-state">
                    <i class="ri-image-line empty-state-icon" style="font-size: 4rem;"></i>
                    <h3 class="empty-state-title">No Images Yet</h3>
                    <p class="empty-state-description">Upload your first images to start using our CDN service.</p>
                    <button class="btn btn-primary" onclick="showImageUploadModal()">
                        <i class="ri-upload-cloud-line"></i> Upload Your First Image
                    </button>
                </div>
            `}
        `;
        
    } catch (error) {
        showToast('Failed to load images', 'error');
    }
}

function showImageUploadModal() {
    const modalBody = `
        <div class="dropzone" id="imageDropzone" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
            <i class="ri-upload-cloud-2-line dropzone-icon" style="font-size: 3rem;"></i>
            <h4>Drop images here or click to browse</h4>
            <p style="color: var(--text-secondary);">Maximum 10 files, 5MB each</p>
            <input type="file" id="imageFiles" multiple accept="image/*" style="display: none;" onchange="handleFileSelect(this.files)">
        </div>
        
        <div id="imagePreviewGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-top: 1rem;"></div>
        
        <div id="uploadActions" style="display: none; margin-top: 1rem;">
            <div class="progress-bar" style="margin-bottom: 1rem;">
                <div class="progress-fill" id="uploadProgress" style="width: 0%;"></div>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="uploadImages()">
                <i class="ri-upload-line"></i> Upload Images
            </button>
        </div>
    `;
    
    showModal('Upload Images', modalBody);
    
    document.getElementById('imageDropzone').addEventListener('click', () => {
        document.getElementById('imageFiles').click();
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('active');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('active');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    handleFileSelect(e.dataTransfer.files);
}

let selectedFiles = [];

function handleFileSelect(files) {
    if (files.length > 10) {
        showToast('Maximum 10 files allowed', 'error');
        return;
    }
    
    selectedFiles = Array.from(files);
    const preview = document.getElementById('imagePreviewGrid');
    preview.innerHTML = '';
    
    selectedFiles.forEach((file, idx) => {
        if (file.size > 5 * 1024 * 1024) {
            showToast(`${file.name} exceeds 5MB limit`, 'error');
            selectedFiles.splice(idx, 1);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML += `
                <div style="position: relative;">
                    <img src="${e.target.result}" style="width: 100%; height: 100px; object-fit: cover; border-radius: var(--radius);">
                    <button class="btn btn-sm btn-danger" style="position: absolute; top: 4px; right: 4px; padding: 0.25rem;" onclick="removeFile(${idx})">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    });
    
    document.getElementById('uploadActions').style.display = selectedFiles.length > 0 ? 'block' : 'none';
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    handleFileSelect(selectedFiles);
}

async function uploadImages() {
    if (selectedFiles.length === 0) {
        showToast('No files selected', 'error');
        return;
    }
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('file', file);
    });
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Uploading...';
    
    try {
        const response = await fetch(`${API_BASE}/images/upload`, {
            method: 'POST',
            headers: {
                'Session-Token': sessionToken
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast(`${result.data.uploaded_images.length} images uploaded successfully`, 'success');
            closeModal();
            loadImages();
        } else {
            throw new Error(result.error?.message || 'Upload failed');
        }
    } catch (error) {
        showToast('Failed to upload images: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-upload-line"></i> Upload Images';
    }
}

function copyImageUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Image URL copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy URL', 'error');
    });
}

function viewImageStats(imageId) {
    const image = currentData.images.find(img => img.image_id === imageId);
    if (!image) return;
    
    const modalBody = `
        <div class="stats-grid" style="margin-bottom: 1.5rem;">
            <div class="stat-card">
                <div class="stat-label">Total Views</div>
                <div class="stat-value">${image.total_views || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Formats Served</div>
                <div class="stat-value">${Object.keys(image.formats || {}).length}</div>
            </div>
        </div>
        
        ${image.monthly_stats && Object.keys(image.monthly_stats).length > 0 ? `
            <div class="analytics-grid">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">Views by Browser</h4>
                    </div>
                    <div class="card-body">
                        <canvas id="imageBrowserChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">Views by Country</h4>
                    </div>
                    <div class="card-body">
                        <canvas id="imageCountryChart"></canvas>
                    </div>
                </div>
            </div>
        ` : '<p style="text-align: center; color: var(--text-secondary);">No statistics available yet</p>'}
    `;
    
    showModal('Image Statistics', modalBody);
    
    // Create charts if data available
    if (image.monthly_stats && Object.keys(image.monthly_stats).length > 0) {
        setTimeout(() => {
            const latestMonth = Object.keys(image.monthly_stats).sort().pop();
            const stats = image.monthly_stats[latestMonth];
            
            if (stats.browser) {
                const ctx1 = document.getElementById('imageBrowserChart')?.getContext('2d');
                if (ctx1) {
                    new Chart(ctx1, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(stats.browser),
                            datasets: [{
                                data: Object.values(stats.browser),
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(239, 68, 68, 0.8)'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });
                }
            }
            
            if (stats.country) {
                const ctx2 = document.getElementById('imageCountryChart')?.getContext('2d');
                if (ctx2) {
                    new Chart(ctx2, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(stats.country),
                            datasets: [{
                                label: 'Views',
                                data: Object.values(stats.country),
                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                borderRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }
                    });
                }
            }
        }, 100);
    }
}

async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
        await api('/images', {
            method: 'DELETE',
            body: JSON.stringify({ image_ids: [imageId] })
        });
        
        showToast('Image deleted successfully', 'success');
        loadImages();
    } catch (error) {
        showToast('Failed to delete image', 'error');
    }
}

// Articles Section
async function loadArticles(page = 1) {
    try {
        paginationState.articles.page = page;
        const { data, pagination } = await api(`/dashboard/articles?page=${page}&page_size=${paginationState.articles.pageSize}`);
        
        currentData.articles = data.articles || [];
        paginationState.articles.total = pagination?.total || 0;
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="ri-article-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.uploaded || 0}</div>
                    <div class="stat-label">Articles Published</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="ri-eye-line"></i>
                    </div>
                    <div class="stat-value">${currentData.articles.reduce((sum, a) => sum + (a.total_views || 0), 0)}</div>
                    <div class="stat-label">Total Views</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="ri-global-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.total_domains || 0}</div>
                    <div class="stat-label">Verified Domains</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="ri-database-line"></i>
                    </div>
                    <div class="stat-value">${data.user?.remaining || 0}</div>
                    <div class="stat-label">Articles Remaining</div>
                </div>
            </div>
            
            <!-- Actions Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>Article Management</h2>
                <button class="btn btn-primary" onclick="showArticleModal()">
                    <i class="ri-add-line"></i> Create Article
                </button>
            </div>
            
            <!-- Articles List -->
            ${currentData.articles.length > 0 ? `
                <div>
                    ${currentData.articles.map(article => `
                        <div class="card" style="margin-bottom: 1rem;">
                            <div class="card-body">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <h4 style="margin-bottom: 0.5rem;">${article.subject}</h4>
                                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                                            <span class="badge badge-primary">
                                                <i class="ri-global-line"></i> ${article.url}
                                            </span>
                                            <span class="badge badge-success">
                                                <i class="ri-eye-line"></i> ${article.total_views || 0} views
                                            </span>
                                            <span class="badge badge-info">
                                                <i class="ri-calendar-line"></i> ${new Date(article.creation_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        ${article.images && article.images.length > 0 ? `
                                            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                                ${article.images.slice(0, 4).map(img => `
                                                    <img src="${img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius);">
                                                `).join('')}
                                                ${article.images.length > 4 ? `
                                                    <div style="width: 60px; height: 60px; background: var(--glass); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                                        +${article.images.length - 4}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn btn-sm btn-secondary" onclick="viewArticle('${article.article_id}')">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="editArticle('${article.article_id}')">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.article_id}')">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${renderPagination('articles', paginationState.articles, loadArticles)}
            ` : `
                <div class="empty-state">
                    <i class="ri-article-line empty-state-icon" style="font-size: 4rem;"></i>
                    <h3 class="empty-state-title">No Articles Yet</h3>
                    <p class="empty-state-description">Create your first article to start publishing content.</p>
                    <button class="btn btn-primary" onclick="showArticleModal()">
                        <i class="ri-add-line"></i> Create Your First Article
                    </button>
                </div>
            `}
        `;
        
    } catch (error) {
        showToast('Failed to load articles', 'error');
    }
}

// Hosting Section
async function loadHosting() {
    try {
        const { data } = await api('/hosting/subscription-status');
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card gradient-1">
                    <div class="stat-icon primary">
                        <i class="ri-vip-crown-line"></i>
                    </div>
                    <div class="stat-value">${(data.current_plan || 'FREE').toUpperCase()}</div>
                    <div class="stat-label">Current Plan</div>
                </div>
                <div class="stat-card gradient-2">
                    <div class="stat-icon success">
                        <i class="ri-image-2-line"></i>
                    </div>
                    <div class="stat-value">${data.images_uploads || 0}/${data.images_limit || 0}</div>
                    <div class="stat-label">Images Used</div>
                </div>
                <div class="stat-card gradient-3">
                    <div class="stat-icon warning">
                        <i class="ri-article-line"></i>
                    </div>
                    <div class="stat-value">${data.article_uploads || 0}/${data.articles_limit || 0}</div>
                    <div class="stat-label">Articles Used</div>
                </div>
                <div class="stat-card gradient-4">
                    <div class="stat-icon info">
                        <i class="ri-calendar-check-line"></i>
                    </div>
                    <div class="stat-value">${data.expiry_date ? new Date(data.expiry_date).toLocaleDateString() : 'Never'}</div>
                    <div class="stat-label">Expires</div>
                </div>
            </div>
            
            <!-- Subscription Details -->
            ${data.is_subscription ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Subscription Details</h3>
                        <button class="btn btn-danger btn-sm" onclick="cancelHostingSubscription()">
                            Cancel Subscription
                        </button>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Status:</strong>
                                <span class="badge badge-${data.subscription_status === 'active' ? 'success' : 'warning'}">
                                    ${data.subscription_status}
                                </span>
                            </div>
                            <div><strong>Subscription ID:</strong> ${data.subscription_id}</div>
                            <div><strong>Period Start:</strong> ${new Date(data.subscription_period_start).toLocaleDateString()}</div>
                            <div><strong>Period End:</strong> ${new Date(data.subscription_period_end).toLocaleDateString()}</div>
                            <div><strong>Last Payment:</strong> $${data.billing?.last_payment_amount} on ${new Date(data.billing?.last_payment_date).toLocaleDateString()}</div>
                            <div><strong>Payment Status:</strong> ${data.billing?.payment_status}</div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Usage Charts -->
            <div class="analytics-grid">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Resource Usage</h3>
                    </div>
                    <div class="card-body">
                        <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Images</span>
                                <span>${data.images_uploads || 0} / ${data.images_limit || 0}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((data.images_uploads || 0) / (data.images_limit || 1) * 100)}%"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Articles</span>
                                <span>${data.article_uploads || 0} / ${data.articles_limit || 0}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((data.article_uploads || 0) / (data.articles_limit || 1) * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Plan Features</h3>
                    </div>
                    <div class="card-body">
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 0.5rem 0;">✓ ${data.images_limit || 0} Image Uploads</li>
                            <li style="padding: 0.5rem 0;">✓ ${data.articles_limit || 0} Article Publications</li>
                            <li style="padding: 0.5rem 0;">✓ Global CDN Distribution</li>
                            <li style="padding: 0.5rem 0;">✓ SSL Certificates</li>
                            <li style="padding: 0.5rem 0;">✓ 99.9% Uptime SLA</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Upgrade Plans -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Available Plans</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div class="card" style="text-align: center; ${data.current_plan === 'basic' ? 'border: 2px solid var(--primary);' : ''}">
                            <div class="card-body">
                                <h4>Basic</h4>
                                <div class="stat-value">$9.99/mo</div>
                                <ul style="list-style: none; padding: 0; margin: 1rem 0;">
                                    <li>100 Images</li>
                                    <li>50 Articles</li>
                                    <li>Basic CDN</li>
                                </ul>
                                ${data.current_plan !== 'basic' ? `
                                    <button class="btn btn-primary" onclick="upgradePlan('basic')">Select Plan</button>
                                ` : '<span class="badge badge-success">Current Plan</span>'}
                            </div>
                        </div>
                        
                        <div class="card" style="text-align: center; ${data.current_plan === 'pro' ? 'border: 2px solid var(--primary);' : ''}">
                            <div class="card-body">
                                <span class="badge badge-warning" style="position: absolute; top: 1rem; right: 1rem;">Popular</span>
                                <h4>Pro</h4>
                                <div class="stat-value">$19.99/mo</div>
                                <ul style="list-style: none; padding: 0; margin: 1rem 0;">
                                    <li>500 Images</li>
                                    <li>200 Articles</li>
                                    <li>Premium CDN</li>
                                    <li>Priority Support</li>
                                </ul>
                                ${data.current_plan !== 'pro' ? `
                                    <button class="btn btn-primary" onclick="upgradePlan('pro')">Select Plan</button>
                                ` : '<span class="badge badge-success">Current Plan</span>'}
                            </div>
                        </div>
                        
                        <div class="card" style="text-align: center; ${data.current_plan === 'enterprise' ? 'border: 2px solid var(--primary);' : ''}">
                            <div class="card-body">
                                <h4>Enterprise</h4>
                                <div class="stat-value">$49.99/mo</div>
                                <ul style="list-style: none; padding: 0; margin: 1rem 0;">
                                    <li>Unlimited Everything</li>
                                    <li>Global CDN</li>
                                    <li>24/7 Phone Support</li>
                                    <li>Custom Features</li>
                                </ul>
                                ${data.current_plan !== 'enterprise' ? `
                                    <button class="btn btn-primary" onclick="upgradePlan('enterprise')">Select Plan</button>
                                ` : '<span class="badge badge-success">Current Plan</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        showToast('Failed to load hosting information', 'error');
    }
}

// Billing Section
async function loadBilling(page = 1) {
    try {
        paginationState.billing.page = page;
        const { data, pagination } = await api(`/dashboard/billings?page=${page}&limit=${paginationState.billing.pageSize}&type=all`);
        
        const allPayments = [...(data.tasks || []), ...(data.hosting || [])];
        paginationState.billing.total = pagination?.total || allPayments.length;
        
        const totalSpent = allPayments.reduce((sum, p) => sum + (p.total_payment || 0), 0);
        const paidCount = allPayments.filter(p => p.status === 'Paid').length;
        const pendingCount = allPayments.filter(p => p.status !== 'Paid').length;
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="ri-money-dollar-circle-line"></i>
                    </div>
                    <div class="stat-value">$${totalSpent.toFixed(2)}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="ri-file-list-3-line"></i>
                    </div>
                    <div class="stat-value">${allPayments.length}</div>
                    <div class="stat-label">Total Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="ri-check-double-line"></i>
                    </div>
                    <div class="stat-value">${paidCount}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="ri-time-line"></i>
                    </div>
                    <div class="stat-value">${pendingCount}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>
            
            <!-- Billing Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Transaction History</h3>
                    <select class="form-select" style="width: auto;" onchange="filterBilling(this.value)">
                        <option value="all">All Types</option>
                        <option value="tasks">Tasks Only</option>
                        <option value="hosting">Hosting Only</option>
                    </select>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allPayments.length > 0 ? allPayments.map(payment => `
                                    <tr>
                                        <td>${new Date(payment.dates?.paid || payment.dates?.created).toLocaleDateString()}</td>
                                        <td>
                                            <span class="badge badge-${payment.method === 'create_task' ? 'primary' : payment.method === 'recharge' ? 'warning' : 'success'}">
                                                ${payment.method === 'create_task' ? 'Task' : payment.method === 'recharge' ? 'Recharge' : 'Hosting'}
                                            </span>
                                        </td>
                                        <td>${payment.details?.url || payment.details?.package || payment.method}</td>
                                        <td>$${(payment.total_payment || 0).toFixed(2)}</td>
                                        <td>
                                            <span class="badge badge-${payment.status === 'Paid' ? 'success' : 'warning'}">
                                                ${payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-secondary" onclick="viewPaymentDetails('${payment.billing_id}')">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" style="text-align: center;">No transactions found</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                    
                    ${renderPagination('billing', paginationState.billing, loadBilling)}
                </div>
            </div>
        `;
        
    } catch (error) {
        showToast('Failed to load billing information', 'error');
    }
}

// Blogs Section
async function loadBlogs(page = 1) {
    try {
        paginationState.blogs.page = page;
        const response = await fetch(`${API_BASE}/blogs?page=${page}&page_size=${paginationState.blogs.pageSize}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            currentData.blogs = result.data.blogs || [];
            paginationState.blogs.total = result.pagination?.total || 0;
            
            const content = document.getElementById('content');
            content.innerHTML = `
                <!-- Search Bar -->
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <input type="text" class="form-input" id="blogSearch" placeholder="Search blog posts..." style="flex: 1;">
                    <button class="btn btn-primary" onclick="searchBlogs()">
                        <i class="ri-search-line"></i> Search
                    </button>
                </div>
                
                <!-- Blog Grid -->
                ${currentData.blogs.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                        ${currentData.blogs.map(blog => `
                            <div class="card" style="cursor: pointer;" onclick="viewBlog('${blog._id}')">
                                ${blog.image_url ? `
                                    <div style="height: 200px; overflow: hidden;">
                                        <img src="${blog.image_url}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                ` : ''}
                                <div class="card-body">
                                    <h4 style="margin-bottom: 0.5rem;">${blog.title}</h4>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                        <span style="font-size: 0.875rem; color: var(--text-secondary);">
                                            By ${blog.writer}
                                        </span>
                                        <span style="font-size: 0.875rem; color: var(--text-secondary);">
                                            ${blog.time}
                                        </span>
                                    </div>
                                    <button class="btn btn-primary btn-sm" style="width: 100%;">
                                        Read More <i class="ri-arrow-right-line"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${renderPagination('blogs', paginationState.blogs, loadBlogs)}
                ` : `
                    <div class="empty-state">
                        <i class="ri-article-line empty-state-icon" style="font-size: 4rem;"></i>
                        <h3 class="empty-state-title">No Blog Posts Found</h3>
                        <p class="empty-state-description">Try searching with different keywords.</p>
                    </div>
                `}
            `;
        }
    } catch (error) {
        showToast('Failed to load blog posts', 'error');
    }
}

async function viewBlog(blogId) {
    try {
        const response = await fetch(`${API_BASE}/blog/${blogId}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            const modalBody = `
                ${result.image_url ? `
                    <img src="${result.image_url}" style="width: 100%; height: 300px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem;">
                ` : ''}
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.875rem;">
                        <span>By ${result.writer}</span>
                        <span>${result.time}</span>
                    </div>
                </div>
                <div style="line-height: 1.8;">
                    ${result.body}
                </div>
            `;
            
            showModal(result.title, modalBody);
        }
    } catch (error) {
        showToast('Failed to load blog post', 'error');
    }
}

// SEO Tools Section
async function loadTools() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="analytics-grid">
            <!-- Keyword Research Tool -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Keyword Research</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Enter URL for keyword analysis</label>
                        <input type="url" class="form-input" id="keywordUrl" placeholder="https://example.com">
                    </div>
                    <button class="btn btn-primary" onclick="analyzeKeywords()">
                        <i class="ri-search-line"></i> Analyze Keywords
                    </button>
                    <div id="keywordResults" style="margin-top: 1rem;"></div>
                </div>
            </div>
            
            <!-- SERP Position Checker -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">SERP Position Checker</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Keyword</label>
                        <input type="text" class="form-input" id="serpKeyword" placeholder="SEO optimization">
                    </div>
                    <div class="form-group">
                        <label class="form-label">URL</label>
                        <input type="url" class="form-input" id="serpUrl" placeholder="example.com">
                    </div>
                    <button class="btn btn-primary" onclick="checkSerpPosition()">
                        <i class="ri-search-line"></i> Check Position
                    </button>
                    <div id="serpResults" style="margin-top: 1rem;"></div>
                </div>
            </div>
        </div>
    `;
}

async function analyzeKeywords() {
    const url = document.getElementById('keywordUrl').value;
    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Analyzing...';
    
    try {
        const response = await fetch(`https://keywords.seotize.net?url=${encodeURIComponent(url)}`, {
            headers: { 'Session-Token': sessionToken }
        });
        const data = await response.json();
        
        document.getElementById('keywordResults').innerHTML = `
            <div style="margin-top: 1rem;">
                <h5>Top Keywords:</h5>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${data.keywords.map(kw => `
                        <span class="badge badge-primary">${kw}</span>
                    `).join('')}
                </div>
            </div>
            ${data.density ? `
                <div style="margin-top: 1rem;">
                    <h5>Keyword Density:</h5>
                    ${Object.entries(data.density).slice(0, 5).map(([kw, density]) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                            <span>${kw}</span>
                            <span class="badge badge-info">${density}%</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } catch (error) {
        showToast('Failed to analyze keywords', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-search-line"></i> Analyze Keywords';
    }
}

async function checkSerpPosition() {
    const keyword = document.getElementById('serpKeyword').value;
    const url = document.getElementById('serpUrl').value;
    
    if (!keyword || !url) {
        showToast('Please enter both keyword and URL', 'error');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Checking...';
    
    try {
        const response = await fetch(`https://search.seotize.workers.dev/?keyword=${encodeURIComponent(keyword)}&url=${encodeURIComponent(url)}`, {
            headers: { 'Session-Token': sessionToken }
        });
        const data = await response.json();
        
        document.getElementById('serpResults').innerHTML = `
            <div class="stats-grid" style="margin-top: 1rem;">
                <div class="stat-card">
                    <div class="stat-label">Position</div>
                    <div class="stat-value">${data.position || 'Not Found'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Page</div>
                    <div class="stat-value">${data.page || 'N/A'}</div>
                </div>
            </div>
            ${data.competitors && data.competitors.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h5>Top Competitors:</h5>
                    <div style="margin-top: 0.5rem;">
                        ${data.competitors.slice(0, 5).map(comp => `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--border);">
                                <span>${comp.url}</span>
                                <span class="badge badge-primary">Position ${comp.position}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    } catch (error) {
        showToast('Failed to check SERP position', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-search-line"></i> Check Position';
    }
}

// Domains Section
async function loadDomains() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Domain Management</h3>
                <button class="btn btn-primary" onclick="showAddDomainModal()">
                    <i class="ri-add-line"></i> Add Domain
                </button>
            </div>
            <div class="card-body">
                <div id="domainsList">
                    <p style="color: var(--text-secondary);">Loading domains...</p>
                </div>
            </div>
        </div>
    `;
    
    // Since there's no list endpoint, we'll show a placeholder
    setTimeout(() => {
        document.getElementById('domainsList').innerHTML = `
            <div class="empty-state">
                <i class="ri-global-line empty-state-icon" style="font-size: 4rem;"></i>
                <h3 class="empty-state-title">Domain Verification</h3>
                <p class="empty-state-description">Add and verify your domains to publish articles.</p>
                <button class="btn btn-primary" onclick="showAddDomainModal()">
                    <i class="ri-add-line"></i> Add Your First Domain
                </button>
            </div>
        `;
    }, 500);
}

function showAddDomainModal() {
    const modalBody = `
        <form id="domainForm">
            <div class="form-group">
                <label class="form-label">Domain URL</label>
                <input type="text" class="form-input" id="domainUrl" placeholder="example.com/blog" required>
                <small style="color: var(--text-secondary);">Enter your domain or subdomain where articles will be published</small>
            </div>
            <div class="card" style="background: var(--glass); padding: 1rem;">
                <p style="font-size: 0.875rem;">
                    After adding your domain, you'll need to verify ownership by adding a TXT record to your DNS settings.
                </p>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                Add Domain
            </button>
        </form>
    `;
    
    showModal('Add Domain', modalBody);
    
    document.getElementById('domainForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addDomain();
    });
}

async function addDomain() {
    const url = document.getElementById('domainUrl').value;
    
    try {
        const { data } = await api('/add-domain', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
        
        if (data.txt_record) {
            const verificationModal = `
                <div class="card" style="background: var(--glass); padding: 1.5rem;">
                    <h4>Domain Added Successfully!</h4>
                    <p style="margin: 1rem 0;">To verify ownership, add this TXT record to your DNS:</p>
                    <div style="background: var(--bg); padding: 1rem; border-radius: var(--radius); font-family: monospace; word-break: break-all;">
                        ${data.txt_record}
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${data.txt_record}').then(() => showToast('Copied to clipboard', 'success'))">
                            <i class="ri-clipboard-line"></i> Copy TXT Record
                        </button>
                        <button class="btn btn-secondary" onclick="verifyDomain('${url}')">
                            <i class="ri-check-line"></i> Verify Now
                        </button>
                    </div>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 1rem;">
                    DNS changes may take up to 48 hours to propagate
                </p>
            `;
            
            showModal('Domain Verification Required', verificationModal);
        } else {
            showToast('Domain added and verified successfully', 'success');
            closeModal();
            loadDomains();
        }
    } catch (error) {
        showToast('Failed to add domain: ' + error.message, 'error');
    }
}

async function verifyDomain(url) {
    try {
        await api('/verify-domain', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
        
        showToast('Domain verified successfully', 'success');
        closeModal();
        loadDomains();
    } catch (error) {
        if (error.message.includes('DNS')) {
            showToast('Verification failed. Please ensure the TXT record is added correctly.', 'warning');
        } else {
            showToast('Failed to verify domain', 'error');
        }
    }
}

// Export functions to global scope
window.loadImages = loadImages;
window.loadArticles = loadArticles;
window.loadHosting = loadHosting;
window.loadBilling = loadBilling;
window.loadBlogs = loadBlogs;
window.loadTools = loadTools;
window.loadDomains = loadDomains;
window.showImageUploadModal = showImageUploadModal;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.handleFileSelect = handleFileSelect;
window.removeFile = removeFile;
window.uploadImages = uploadImages;
window.copyImageUrl = copyImageUrl;
window.viewImageStats = viewImageStats;
window.deleteImage = deleteImage;
window.showArticleModal = showArticleModal;
window.viewArticle = viewArticle;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.cancelHostingSubscription = cancelHostingSubscription;
window.upgradePlan = upgradePlan;
window.viewPaymentDetails = viewPaymentDetails;
window.filterBilling = filterBilling;
window.searchBlogs = searchBlogs;
window.viewBlog = viewBlog;
window.analyzeKeywords = analyzeKeywords;
window.checkSerpPosition = checkSerpPosition;
window.showAddDomainModal = showAddDomainModal;
window.addDomain = addDomain;
window.verifyDomain = verifyDomain;