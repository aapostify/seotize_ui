
// Function to get the script tag for engine.js
function getEngineScriptTag() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src.indexOf('seotize-engine.js') > -1) {
            return scripts[i];
        }
    }
    return null;
}

// Function to get URL parameter from a given URL
function getURLParameter(url, name) {
    const params = new URLSearchParams(url);
    return params.get(name);
}

// Get the script tag for engine.js
const engineScriptTag = getEngineScriptTag();
if (engineScriptTag) {
    // Extract the 'id' parameter from the script's src attribute
    const id = getURLParameter(engineScriptTag.src.split('?')[1], 'id');
   
    if (id === null) {
        alert("'id' not found in script tag. Exiting...");
    }
    window.SYSYID = id;

    function d421(subtask_id) {
        document.getElementsByClassName('rainbow-animation')[0].style.pointerEvents = 'none';
        turnstile.reset();
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            showConfirmButton: false,
            onOpen: () => {
                Swal.showLoading();
            }
        });
        var checkAndProceed = function() {
            var responseElement = document.getElementsByName('cf-turnstile-response')[0];
            if (responseElement) {
                var waitForValue = function() {
                    if (responseElement.value !== '') {
                        var myHeaders = new Headers();
                        myHeaders.append("Content-Type", "application/json");
                        var raw = JSON.stringify({
                            "unique_id": window.unique_id,
                            "cf-turnstile-response": responseElement.value,
                            "sub_task_id": subtask_id
                        });
                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: raw,
                            redirect: 'follow'
                        };
                        fetch('https://api.seotize.net/do-task', requestOptions)
                            .then(response => response.text())
                            .then(result => {
                                Swal.close();
                                window.after_noice_result = JSON.parse(result);
                                if ('status' in window.after_noice_result && window.after_noice_result['status'] == 'success') {
                                    if (window.after_noice_result['data']['all_tasks_complete'] == false) {
                                        Swal.fire({
                                            title: 'GOOD JOB, ' + (window.DEEZ.length - (window.RNDR_CNT + 1)) + ' MORE!',
                                            html: 'You Have Collected a Diamond, ' + (window.DEEZ.length - (window.RNDR_CNT + 1)) + ' More To Go!',
                                            timer: 2000,
                                            icon: 'success',
                                            allowOutsideClick: false,
                                            showConfirmButton: false,
                                            timerProgressBar: true,
                                            willClose: () => {
                                                window.DADEEZ();
                                            }
                                        });
                                    } else {
                                        Swal.fire({
                                            title: 'CONGRATULATION!',
                                            html: 'Reward is Yours! You Have Collected all of the Diamonds, you will be redirected to the dashboard.',
                                            timer: 3000,
                                            icon: 'success',
                                            allowOutsideClick: false,
                                            showConfirmButton: false,
                                            timerProgressBar: true,
                                            willClose: () => {
                                                window.location.href = "https://partner.seotize.net/dashboard/wallet/?status=reward";
                                            }
                                        });
                                    }
                                } else {
                                    alert(window.after_noice_result['data']['message'])
                                }
                            })
                            .catch(error => {
                                Swal.close();
                                Swal.fire('Error', error, 'error');
                            });
                    } else {
                        setTimeout(waitForValue, 100);
                    }
                };
                waitForValue();
            } else {
                var observer = new MutationObserver(function(mutations, me) {
                    var responseElement = document.getElementsByName('cf-turnstile-response')[0];
                    if (responseElement) {
                        me.disconnect();
                        checkAndProceed();
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        };
        checkAndProceed();
    }
    window.d421 = d421;

    function injectSvgIntoElement(cssSelector, subtask_id) {
        var targetElement = document.querySelector(cssSelector);
        if (targetElement) {
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('fill', 'blue');
            svg.setAttribute('width', '55px');
            svg.setAttribute('height', '55px');
            svg.setAttribute('viewBox', '0 0 16 16');
            svg.innerHTML = '<path d="M0 5.04V4l4-4h8l4 4v1.04L8 16 0 5.04zM2 5l6 8.5L4 5H2zm12 0h-2l-4 8.5L14 5zM6 5l2 6 2-6H6zM4 2L2 4h2l2-2H4zm8 0h-2l2 2h2l-2-2zM7 2L6 4h4L9 2H7z" fill-rule="evenodd"/>';
            svg.setAttribute('onclick', 'window.d421(\'' + subtask_id + '\')');
            svg.setAttribute('id', 'subtask_id');
            var parent = targetElement.parentNode;
            var nextSibling = targetElement.nextSibling;
            parent.insertBefore(svg, nextSibling);
        } else {
            console.warn('Element not found for the given CSS selector:', cssSelector);
        }
    }

    window.injectSvgIntoElement = injectSvgIntoElement;
    window.DAID = [];
    window.DEEZ = [];
    window.RNDR_CNT = -1;
    window.currentArrow = null;

    function DADEEZ() {
        window.DAID = window.DAID.filter(item => item);
        window.deleteSvgElementsWithIdset();
        window.RNDR_CNT += 1;
        if (window.DEEZ.length > window.RNDR_CNT) {
            document.body.appendChild(window.DEEZ[window.RNDR_CNT]);
            window.createGuidingArrow(window.DEEZ[window.RNDR_CNT]);
        } else {
            if (window.currentArrow && window.currentArrow.parentNode) {
                window.currentArrow.parentNode.removeChild(window.currentArrow);
            }
        }
    }
    window.DADEEZ = DADEEZ;

    function deleteSvgElementsWithIdset() {
        var svgElements = document.querySelectorAll('svg[idset]');
        svgElements.forEach(function(svgElement) {
            svgElement.parentNode.removeChild(svgElement);
        });
    }
    window.deleteSvgElementsWithIdset = deleteSvgElementsWithIdset;

    function createGuidingArrow(targetSvg) {
        if (window.currentArrow && window.currentArrow.parentNode) {
            window.currentArrow.parentNode.removeChild(window.currentArrow);
        }

        var arrow = document.createElement('div');
        arrow.style.position = 'fixed';
        arrow.style.zIndex = '99999999999999999999999999';
        arrow.style.pointerEvents = 'none';
        arrow.style.fontSize = '48px';
        arrow.innerHTML = '👇';
        arrow.style.transition = 'all 0.3s ease';
        document.body.appendChild(arrow);
        window.currentArrow = arrow;

        function updateArrowPosition() {
            if (!targetSvg || !targetSvg.parentNode) {
                if (arrow && arrow.parentNode) {
                    arrow.parentNode.removeChild(arrow);
                }
                return;
            }

            var rect = targetSvg.getBoundingClientRect();
            var viewportHeight = window.innerHeight;
            var viewportWidth = window.innerWidth;
            var targetY = rect.top + rect.height / 2;
            var targetX = rect.left + rect.width / 2;

            var isVisible = rect.top >= 0 && rect.bottom <= viewportHeight && 
                           rect.left >= 0 && rect.right <= viewportWidth;

            if (isVisible) {
                arrow.style.top = (rect.top - 60) + 'px';
                arrow.style.left = (targetX - 24) + 'px';
                arrow.innerHTML = '👇';
                arrow.style.opacity = '0.9';
            } else {
                if (rect.top < 0) {
                    arrow.style.top = '20px';
                    arrow.innerHTML = '👆';
                    arrow.style.opacity = '1';
                    arrow.style.left = (viewportWidth / 2 - 24) + 'px';
                } else if (rect.top > viewportHeight) {
                    arrow.style.top = (viewportHeight - 70) + 'px';
                    arrow.innerHTML = '👇';
                    arrow.style.opacity = '1';
                    arrow.style.left = (viewportWidth / 2 - 24) + 'px';
                } else {
                    if (rect.left < 0) {
                        arrow.style.left = '20px';
                        arrow.innerHTML = '👉';
                        arrow.style.top = '50%';
                    } else if (rect.right > viewportWidth) {
                        arrow.style.left = (viewportWidth - 70) + 'px';
                        arrow.innerHTML = '👈';
                        arrow.style.top = '50%';
                    }
                }
            }
        }

        updateArrowPosition();
        var scrollInterval = setInterval(updateArrowPosition, 100);

        anime({
            targets: arrow,
            translateY: [0, 15, 0],
            easing: 'easeInOutSine',
            duration: 1500,
            loop: true
        });

        targetSvg.addEventListener('click', function() {
            clearInterval(scrollInterval);
            if (arrow && arrow.parentNode) {
                arrow.parentNode.removeChild(arrow);
            }
        }, { once: true });
    }
    window.createGuidingArrow = createGuidingArrow;

    if (document.referrer.includes("google.com")) {
        var script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
        document.head.appendChild(script);

        var script2 = document.createElement('script');
        script2.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
        script2.defer = true;
        document.head.appendChild(script2);

        var script3 = document.createElement('script');
        script3.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
        document.head.appendChild(script3);

        var script4 = document.createElement('script');
        script4.src = "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js";
        document.head.appendChild(script4);

        var xstyle = document.createElement('style');
        xstyle.type = 'text/css';

        var keyFrames = `
        @keyframes rainbowColor {
            0% { fill: red; }
            25% { fill: blue; }
            50% { fill: red; }
            75% { fill: blue; }
            100% { fill: orange; }
        }

        .rainbow-animation {
            animation: rainbowColor 7s linear infinite;
        }`;

        if (xstyle.styleSheet) {
            xstyle.styleSheet.cssText = keyFrames;
        } else {
            xstyle.appendChild(document.createTextNode(keyFrames));
        }

        document.head.appendChild(xstyle);

        var scriptsToLoad = 4;
        function scriptLoaded() {
            scriptsToLoad--;
            if (scriptsToLoad === 0) {
                Swal.fire({
                    title: 'Loading...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    onOpen: () => {
                        Swal.showLoading();
                    }
                });

                function getBrowserData() {
                    var userAgent = navigator.userAgent;
                    var language = navigator.language;
                    var platform = navigator.platform;
                    var screenResolution = screen.width + 'x' + screen.height;
                    var combinedData = `${userAgent}|${language}|${platform}|${screenResolution}`;
                    return combinedData;
                }

                function hashData(data) {
                    return CryptoJS.MD5(data).toString();
                }

                function displayHash() {
                    var browserData = getBrowserData();
                    var hashedData = hashData(browserData);
                    return hashedData;
                }

                window.unique_id = displayHash();

                function injectRandomPositionedSvgs(numberOfSvgs) {
                    var scrollHeight = Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                        document.body.offsetHeight,
                        document.documentElement.offsetHeight,
                        document.body.clientHeight,
                        document.documentElement.clientHeight
                    );

                    var viewportWidth = window.innerWidth;
                    var viewportHeight = window.innerHeight;
                    var svgSize = 45;
                    var sectionHeight = scrollHeight / numberOfSvgs;

                    for (let i = 0; i < numberOfSvgs; i++) {
                        var sectionStart = i * sectionHeight;
                        var sectionEnd = (i + 1) * sectionHeight;
                        var yPosition = sectionStart + (sectionEnd - sectionStart) * 0.5 + (Math.random() - 0.5) * (sectionHeight * 0.3);
                        
                        var xPosition = Math.random() * (viewportWidth - svgSize - 100) + 50;

                        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.setAttribute('width', `${svgSize}px`);
                        svg.setAttribute('height', `${svgSize}px`);
                        svg.setAttribute('viewBox', '0 0 16 16');
                        var subtask_id = window.DAID[i.toString()];
                        svg.setAttribute('idset', subtask_id);
                        svg.setAttribute('onclick', 'window.d421(\'' + subtask_id + '\')');

                        svg.innerHTML = '<path d="M0 5.04V4l4-4h8l4 4v1.04L8 16 0 5.04zM2 5l6 8.5L4 5H2zm12 0h-2l-4 8.5L14 5zM6 5l2 6 2-6H6zM4 2L2 4h2l2-2H4zm8 0h-2l2 2h2l-2-2zM7 2L6 4h4L9 2H7z" fill-rule="evenodd"/>';
                        svg.style.position = 'absolute';
                        svg.style.zIndex = '9999999999999999999999999';
                        svg.style.top = `${yPosition}px`;
                        svg.style.left = `${xPosition}px`;
                        svg.style.cursor = `pointer`;

                        svg.classList.add('rainbow-animation');

                        if (typeof subtask_id !== 'undefined') {
                            window.DEEZ.push(svg);

                            anime({
                                targets: svg,
                                easing: 'easeInOutSine',
                                duration: 1500,
                                loop: true,
                                direction: 'alternate',
                                keyframes: [
                                    { scale: 1 },
                                    { scale: 1.2 },
                                    { scale: 1 }
                                ],
                                filter: [
                                    { value: 'drop-shadow(0 0 8px blue)' },
                                    { value: 'drop-shadow(0 0 20px blue)' },
                                    { value: 'drop-shadow(0 0 8px blue)' }
                                ]
                            });
                        }
                    }
                }

                function seotize_initiate(unique_id) {
                    var checkAndProceed = function() {
                        var responseElement = document.getElementsByName('cf-turnstile-response')[0];
                        if (responseElement) {
                            var waitForValue = function() {
                                if (responseElement.value !== '') {
                                    var myHeaders = new Headers();
                                    myHeaders.append("Content-Type", "application/json");
                                    var raw = JSON.stringify({
                                        "unique_id": unique_id,
                                        "cf-turnstile-response": responseElement.value
                                    });
                                    var requestOptions = {
                                        method: 'POST',
                                        headers: myHeaders,
                                        body: raw,
                                        redirect: 'follow'
                                    };
                                    fetch("https://api.seotize.net/get-partner-subtasks", requestOptions)
                                        .then(response => response.text())
                                        .then(result => {
                                            Swal.close();
                                            window.noice_result = JSON.parse(result);
                                            if ('subtasks_info' in window.noice_result) {
                                                Swal.fire({
                                                    title: 'Welcome Seotize Partner',
                                                    html: 'Thank you for starting the task, you are at the right place. After this popup closes, please follow the animated arrow to find and click on the first diamond.',
                                                    timer: 8000,
                                                    allowOutsideClick: false,
                                                    showConfirmButton: false,
                                                    timerProgressBar: true,
                                                    willClose: () => {
                                                        injectRandomPositionedSvgs(window.noice_result.subtasks_info.length);
                                                        DADEEZ();
                                                    }
                                                });
                                                window.DAID_COUNTER = -1;
                                                window.noice_result.subtasks_info.forEach(subtask => {
                                                    window.DAID_COUNTER += 1;
                                                    if (subtask.status == 'incomplete') {
                                                        console.log(subtask.status);
                                                        console.log(subtask.subtask_id);
                                                        window.DAID[window.DAID_COUNTER.toString()] = subtask.subtask_id;
                                                    }
                                                });
                                            }
                                        })
                                        .catch(error => {
                                            Swal.close();
                                            Swal.fire('Error', error, 'error');
                                        });
                                } else {
                                    setTimeout(waitForValue, 100);
                                }
                            };
                            waitForValue();
                        } else {
                            var observer = new MutationObserver(function(mutations, me) {
                                var responseElement = document.getElementsByName('cf-turnstile-response')[0];
                                if (responseElement) {
                                    me.disconnect();
                                    checkAndProceed();
                                }
                            });
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true
                            });
                        }
                    };
                    checkAndProceed();
                }

                var div = document.createElement('div');
                div.className = 'cf-turnstile';
                div.setAttribute('data-theme', 'dark');
                div.setAttribute('data-sitekey', window.SYSYID);
                div.style.cssText = 'border:none;margin: 0 auto;display: block;text-align: center;padding-top: 15px;padding-bottom: 15px;border: 0px!important';
                document.body.insertBefore(div, document.body.firstChild);

                function onloadTurnstileCallback() {
                    seotize_initiate(window.unique_id);
                }

                window.seotize_initiate = seotize_initiate;
            }
        }
        script.onload = script2.onload = script3.onload = script4.onload = scriptLoaded;
    }
}

function onloadTurnstileCallback() {
    window.seotize_initiate(window.unique_id);
}

if (!engineScriptTag) {
    alert("engine.js script tag not found.");
}