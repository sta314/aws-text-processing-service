var isAuthenticated = false;
var signedUsername = 'JohnDoe';
var signedUserid = 1244;

var loginListenerAttached = false;
var logoutListenerAttached = false;
var registerListenerAttached = false;

const colors = {
    activeButton: '#FF9900',
    inactiveButton: '#777'
};

function updateUserActions() {
    const authOuterContainer = document.querySelector('.auth-outer-container');
    const contentContainer = document.querySelector('.content-container');
    const userActionsDiv = document.querySelector('.user-actions');
    if (isAuthenticated) {
        authOuterContainer.style.display = 'none';
        contentContainer.style.display = 'block';
        userActionsDiv.innerHTML = `<div>Logged in as <span class="username">${signedUsername}</span></div><button class="logout-btn">Logout</button>`;
        addListenersLogout();
    } else {
        addListenersLogin();
        addListenersRegister();
        authOuterContainer.style.display = 'block';
        contentContainer.style.display = 'none';
    }
}

function addListenersLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginListenerAttached){
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
        
            var username = event.target.elements['username'].value;
            var password = event.target.elements['password'].value;
        
            Swal.fire({
                title: 'Logging in...',
                allowOutsideClick: false,
                showConfirmButton: false,
                
                onBeforeOpen: () => {
                    Swal.showLoading()
                }
            });

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    Swal.fire({title: 'Failure', text: data.error, icon: 'error', confirmButtonColor: '#ff9900'});
                } else {
                    Swal.fire({title: 'Success', text: 'Logged in successfully', icon: 'success', confirmButtonColor: '#ff9900'});
                    signedUsername = username
                    isAuthenticated = true;
                    updateUserActions();
                    setTabState('process');
                }
            });
        });
        loginListenerAttached = true
    }
}

function addListenersLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (!logoutListenerAttached){
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();
            clearContainers();

            Swal.fire({
                title: 'Logging out...',
                allowOutsideClick: false,
                showConfirmButton: false,
                
                onBeforeOpen: () => {
                    Swal.showLoading()
                }
            });

            fetch('/logout', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    // Handle error
                } else {
                    Swal.close();
                    isAuthenticated = false;
                    updateUserActions();
                }
            });
        });
        logoutListenerAttached = false;
    }
}

function addListenersRegister() {
    const registerForm = document.getElementById('registerForm');
    if (!registerListenerAttached){
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const registerForm = document.getElementById('registerForm');
        
            var username = event.target.elements['username'].value;
            var password = event.target.elements['password'].value;
            var email = event.target.elements['email'].value;

            Swal.fire({
                title: 'Registering...',
                allowOutsideClick: false,
                showConfirmButton: false,
                
                onBeforeOpen: () => {
                    Swal.showLoading()
                }
            });

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password) + '&email=' + encodeURIComponent(email)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    Swal.fire({title: 'Failure', text: data.error, icon: 'error', confirmButtonColor: '#ff9900'});
                } else {
                    clearFormFields(registerForm)
                    document.getElementById('showLogin').dispatchEvent(new Event('click'))
                    Swal.fire({title: 'Success', text: 'Registered successfully', icon: 'success', confirmButtonColor: '#ff9900'});
                }
            });
        });
        registerListenerAttached = true
    }
}

function clearFormFields(form) {
    form.reset();
}

function setTabState(content) {

    const processButton = document.querySelector('.navigation-button-left');
    const libraryButton = document.querySelector('.navigation-button-right');
    const processContent = document.getElementById('process-content');
    const libraryContent = document.getElementById('library-content');
    const jobContent = document.getElementById('job-content');

    button = content === 'process' ? processButton : libraryButton;

    processButton.style.backgroundColor = colors.inactiveButton;
    libraryButton.style.backgroundColor = colors.inactiveButton;
    button.style.backgroundColor = colors.activeButton;
    processContent.style.display = content === 'process' ? 'block' : 'none';
    libraryContent.style.display = content === 'library' ? 'block' : 'none';
    jobContent.style.display = content === 'job' ? 'block' : 'none';
}

function handleProcess(){
    clearContainers();
    setTabState('process');
}

function handleLibrary(){
    clearContainers();
    setTabState('library');

    // Show loading popup
    Swal.fire({
        title: 'Loading...',
        allowOutsideClick: false,
        showConfirmButton: false,
        
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    });

    // get libraryData from API
    fetch('/api/libraryData')
        .then(response => response.json())
        .then(data => {
            // Close loading popup
            Swal.close();
            populateLibrary(data);
        })
        .catch(error => {
            // Close loading popup and show error message
            Swal.close();
            Swal.fire('Error', 'Failed to load library data', 'error');
        });
}

function handleJob(job_id){
    clearContainers();
    setTabState('job');

    Swal.fire({
        title: 'Job loading...',
        allowOutsideClick: false,
        showConfirmButton: false,
        
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    });
    
    // get jobData from API
    fetch(`/api/jobData/${job_id}`)
        .then(response => response.json())
        .then(data => {

            Swal.close();
            populateJob(data);
            populateFileContent(null);
        });
}

function handleFileContent(file_id, file_name, type){
    // get fileContentData from API
    Swal.fire({
        title: 'File loading...',
        allowOutsideClick: false,
        showConfirmButton: false,
        
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    });
    fetch(`/api/fileContentData/${file_id}/${file_name}/${type}`)
        .then(response => response.json())
        .then(data => {Swal.close();populateFileContent(data)});
}

function populateLibrary(libraryData) {
    const libraryContainer = document.querySelector('.library-container');
    libraryContainer.innerHTML = "";

    libraryData.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('library-row');
        
        let content = `
            <input type="hidden" class="job-id" name="job-id" value=${item.jobid}>
            <div class="library-first-col">
                <div class="job-type">${item.jobtype}</div>
                <div class="submitted-time">Submitted: ${item.submittime}</div>
            </div>
        `;

        if (item.state1 === "Processed") {
            content += `
                <div class="library-second-col-inclusive">
                <div class="state1">
                    <button class="library-button-1">
                        ${item.state1}
                    </button>
                </div>
                    <div class="library-second-col">
                        <div class="state2">${item.state2}</div>
                        <div class="expiration-time">Expires: ${item.expirationtime}</div>
                        <div class="expiration-left">${item.expirationleft}</div>
                    </div>
                    <div class="library-third-col">
                    <button class="library-button-2">See Results</button>
                    </div>
                </div>
            `;
        } else if (item.state1 === "Processing") {
            content += `
                <div class="library-second-col-inclusive">
                    <div class="state1">
                        <button class="library-button-1">
                            ${item.state1}
                        </button>
                    </div>
                    <div class="library-second-col">
                        <div class="state2">${item.state2}</div>
                        <div class="progress-bar">
                            <div class="progress-bar-inner" style="width: ${item.percentage}%"></div>
                        </div>
                        <div class="remainingtime">${item.remainingtime}</div>
                    </div>
                    <div class="library-third-col">
                    </div>
                </div>
            `;
        } else { // Process
            content += `
                <div class="library-second-col-inclusive">
                    <div class="state1">
                        <button class="library-button-1">
                            ${item.state1}
                        </button>
                    </div>
                </div>
            `;
        }
        
        row.innerHTML = content;

        const firstButton = row.querySelector('.library-button-1');
        const secondButton = row.querySelector('.library-button-2');

        // Set attributes of buttons

        if (item.state1 === "Processed") {
            firstButton.style.backgroundColor = '#ff9900'
            firstButton.style.cursor = 'default';
        } else if (item.state1 === "Processing") {
            firstButton.style.backgroundColor = '#ff9900'
            firstButton.style.cursor = 'default';
        } else { // Process
            firstButton.style.setProperty('--background-color', '#777777');
            firstButton.style.setProperty('--hover-background-color', '#444444');
            firstButton.style.cursor = 'cursor';
        }

        libraryContainer.appendChild(row);
    });

    // Handle buttons
    const seeJobButtons = document.querySelectorAll('.library-button-2');
    seeJobButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleJob(button.closest('.library-row').querySelector('.job-id').value);
        });
    });

}

function populateJob(jobData) {
    const filelistContainer = document.querySelector('.filelist-container');
    filelistContainer.innerHTML = "";

    jobData.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('filelist-row');

        let filename_trimmed = item.filename;
        if (filename_trimmed.length > 13) {
            const extensionIndex = filename_trimmed.lastIndexOf('.');
            const filenameWithoutExtension = filename_trimmed.substring(0, extensionIndex);
            const extension = filename_trimmed.substring(extensionIndex);
            filename_trimmed = filenameWithoutExtension.substring(0, 13) + '...' + extension;
        }
    
        let content = `
            <input type="hidden" class="file-id" name="file-id" value=${item.fileid}>
            <div class="filelist-description">
                <img class="file-type-icon" src="${static_url + 'assets/' + item.filetype + '-icon.png'}">
                <div class="file-name">${filename_trimmed}</div>
                <img class="file-state-icon" src="${static_url + 'assets/' + item.filestate + '-icon.png'}">
            </div>
            <div class="filelist-btns">
                <button class="filelist-btn filelist-btn-1"> Show Text </button>
                <button class="filelist-btn filelist-btn-2"> Show Result </button>
            </div>
        `;
        
        row.innerHTML = content;
    
    
        const secondButton = row.querySelector('.filelist-btn-2');
    
        // Set attributes of buttons
    
        if (item.filestate === "success") {
            secondButton.style.setProperty('--background-color', '#ff9900');
            secondButton.style.setProperty('--hover-background-color', '#cb7a00');
            
            secondButton.style.cursor = 'cursor';
        } else {
            secondButton.style.backgroundColor = '#777'
            secondButton.style.cursor = 'default';
        }
    
        filelistContainer.appendChild(row);
    });

    // Handle buttons
    const contentButtons = document.querySelectorAll('.filelist-btn');
    contentButtons.forEach(button => {
        button.addEventListener('click', function() {
            type = button.classList.contains('filelist-btn-1') ? 'text' : 'result';
            handleFileContent(button.closest('.filelist-row').querySelector('.file-id').value, button.closest('.filelist-row').querySelector('.file-name').innerHTML, type);
        });
    });
}

function populateFileContent(fileContentData) {
    const fileContentContainer = document.querySelector('.filecontent-container');
    fileContentContainer.innerHTML = '';
    
    item = fileContentData

    let content = ''

    if (fileContentData != null) {
        content = `
            <div class="filecontent-name">${item.name}</div>
            <div class="round-container filecontent-content">
                <textarea readonly class="filecontent-text">${item.text}</textarea>
            </div>
            <div class="filecontent-bottom">
                <div class="filecontent-typeinfo">${item.processtype}</div>
                <div class="filecontent-bottom-copypart" id="copyButton">
                    <img class="filecontent-copyicon" src="${static_url + 'assets/copy.png'}">
                    <div class="filecontent-copytext">Copy to clipboard</div>
                </div>
            </div>
        `;

        fileContentContainer.innerHTML = content;
        
        document.getElementById('copyButton').addEventListener('click', function() {
            var textArea = document.querySelector('.filecontent-text');
            textArea.select();
            document.execCommand('copy');
            Swal.fire({title: 'Copied', text: 'Text copied to clipboard', iconHtml: `<img class="filecontent-copyicon" src="${static_url + 'assets/copy.png'}"">`, confirmButtonColor: '#ff9900'});
        });
    } else {
        content = `
            <div class="filecontent-name">Select a file to show original or processed content </div>
        `;
        fileContentContainer.innerHTML = content;
    }
}

function clearContainers() {
    const libraryContainer = document.querySelector('.library-container');
    libraryContainer.innerHTML = "";
    const filelistContainer = document.querySelector('.filelist-container');
    filelistContainer.innerHTML = "";
    const fileContentContainer = document.querySelector('.filecontent-container');
    fileContentContainer.innerHTML = "";
}

document.addEventListener("DOMContentLoaded", function() {

    // Navigation button handling

    const processButton = document.querySelector('.navigation-button-left');
    const libraryButton = document.querySelector('.navigation-button-right');

    setTabState('process');

    processButton.addEventListener('click', function() {
        handleProcess();
    });

    libraryButton.addEventListener('click', function() {
        handleLibrary();
    });

    // Handle form inputs

    document.getElementById('singleTextUpload').addEventListener('click', function() {
        var textInput = document.getElementById('text');
        var text = textInput.value;
        var formData = new FormData();
        formData.append('text', text);
        formData.append('prompt', document.getElementById('prompt').value);
    
        fetch('/upload', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                Swal.fire({title: 'Success', text: 'Job submitted successfully', icon: 'success', confirmButtonColor: '#ff9900'});
                fileInput.value = null
                fileInput.dispatchEvent(new Event('change'));
            } else {
                Swal.fire({title: 'Error', text: 'Job submit failed', icon: 'error', confirmButtonColor: '#ff9900'});
                fileInput.value = null
                fileInput.dispatchEvent(new Event('change'));
            }
        });

        textInput.value = '';
    });

    document.getElementById('singleImageUpload').addEventListener('click', function() {
        var fileInput = document.getElementById('selectImage');
        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('file', file);
        formData.append('prompt', document.getElementById('prompt').value);
    
        fetch('/upload', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                Swal.fire({title: 'Success', text: 'Job submitted successfully', icon: 'success', confirmButtonColor: '#ff9900'});
                fileInput.value = null
                fileInput.dispatchEvent(new Event('change'));
            } else {
                Swal.fire({title: 'Error', text: 'Job submit failed', icon: 'error', confirmButtonColor: '#ff9900'});
                fileInput.value = null
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    });

    document.getElementById('batchUpload').addEventListener('click', function() {
        var directoryInput = document.getElementById('selectDirectory');
        var files = directoryInput.files;
        var formData = new FormData();
        for (var i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('prompt', document.getElementById('prompt').value);
    
        fetch('/upload', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                Swal.fire({title: 'Success', text: 'Batch job submitted successfully', icon: 'success', confirmButtonColor: '#ff9900'});
                directoryInput.value = null
                directoryInput.dispatchEvent(new Event('change'));
            } else {
                Swal.fire({title: 'Error', text: 'Job submit failed', icon: 'error', confirmButtonColor: '#ff9900'});
                directoryInput.value = null
                directoryInput.dispatchEvent(new Event('change'));
            }
        });
    });

    updateUserActions();
    populateFileContent(fileContentData);
});

document.getElementById('showRegister').addEventListener('click', function() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('registerContainer').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', function() {
    document.getElementById('registerContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
});

document.getElementById('selectImage').addEventListener('change', function() {
    if (this.value != null && this.files && this.files.length > 0) {
        this.parentElement.style.backgroundColor = '#c1e7ac';
    } else {
        this.parentElement.style.backgroundColor = '';
    }
});

document.getElementById('selectDirectory').addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        this.parentElement.style.backgroundColor = '#c1e7ac';
    } else {
        this.parentElement.style.backgroundColor = '';
    }
});