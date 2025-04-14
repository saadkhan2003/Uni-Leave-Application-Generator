/**
 * University Leave Application Generator
 * 
 * This script handles all the functionality for the leave application generator,
 * including form handling, template generation, signature pad, and local storage.
 */

// Global Variables
let signaturePad; // Signature pad instance
let currentFont = "'Kalam', cursive"; // Default handwriting font (fifth font option)
let currentColor = "#000000"; // Default ink color
let hasRuledLines = false; // Default paper style - no lines
let hasAgedEffect = false; // Default paper style - not aged

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tabs
    initTabs();
    
    // Initialize Template Selector
    initTemplateSelector();
    
    // Initialize Signature Pad
    initSignaturePad();
    
    // Initialize Settings
    initSettings();
    
    // Load Defaults from LocalStorage
    loadDefaults();
    
    // Set Default Date
    setDefaultDate();
    
    // Initialize Generate Button
    document.getElementById('generate-btn').addEventListener('click', generateApplication);
    
    // Initialize Save & Clear Buttons
    document.getElementById('save-data').addEventListener('click', saveFormData);
    document.getElementById('clear-data').addEventListener('click', clearFormData);
    
    // Initialize Print & PDF Buttons
    document.getElementById('print-btn').addEventListener('click', printApplication);
    document.getElementById('download-pdf').addEventListener('click', downloadAsPDF);
});

/**
 * Initializes the tab switching functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Add active class to clicked tab
            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
            
            // If switching to preview tab, generate application
            if (targetTab === 'preview') {
                generateApplication();
            }
            
            // Resize signature pad on tab change (fixes canvas sizing issues)
            if (targetTab === 'form' && signaturePad) {
                resizeCanvas();
            }
        });
    });
}

/**
 * Initializes the template selector to show/hide relevant fields
 */
function initTemplateSelector() {
    const templateSelector = document.getElementById('template');
    
    // Handle template change
    templateSelector.addEventListener('change', handleTemplateChange);
    
    // Set initial template
    handleTemplateChange();
}

/**
 * Shows/hides relevant form fields based on selected template
 */
function handleTemplateChange() {
    const templateSelector = document.getElementById('template');
    const selectedTemplate = templateSelector.value;
    
    // Hide all template fields
    document.querySelectorAll('.template-fields').forEach(fields => {
        fields.style.display = 'none';
    });
    
    // Show selected template fields
    document.getElementById(`${selectedTemplate}-fields`).style.display = 'block';
}

/**
 * Initializes the signature pad
 */
function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    
    // Initialize signature pad
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    // Clear signature button
    document.getElementById('clear-signature').addEventListener('click', () => {
        signaturePad.clear();
    });
    
    // Upload signature
    document.getElementById('upload-signature').addEventListener('change', uploadSignature);
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize canvas size
    resizeCanvas();
}

/**
 * Resizes the signature canvas to match its container
 */
function resizeCanvas() {
    const canvas = document.getElementById('signature-pad');
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const container = canvas.parentElement;
    
    canvas.width = container.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    
    // Clear and redraw
    signaturePad.clear();
}

/**
 * Handles signature image upload
 */
function uploadSignature(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('signature-pad');
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                signaturePad.clear();
                
                // Calculate dimensions to maintain aspect ratio
                const maxWidth = canvas.width;
                const maxHeight = canvas.height;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }
                
                if (height > maxHeight) {
                    const ratio = maxHeight / height;
                    height = maxHeight;
                    width = width * ratio;
                }
                
                // Center the image
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2;
                
                // Draw image on canvas
                ctx.drawImage(img, x, y, width, height);
                
                // Update signature pad data
                setTimeout(() => {
                    if (signaturePad._isEmpty) {
                        signaturePad._data = signaturePad.toData();
                    }
                }, 100);
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

/**
 * Initializes the settings tab functionality
 */
function initSettings() {
    // Font Selection
    document.querySelectorAll('.font-option').forEach(option => {
        option.addEventListener('click', () => {
            currentFont = option.getAttribute('data-font');
            updateFontSelection(option);
            updatePreviewStyle();
            saveSettings();
        });
    });
    
    // Color Selection
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            currentColor = option.getAttribute('data-color');
            updateColorSelection(option);
            updatePreviewStyle();
            saveSettings();
        });
    });
    
    // Paper Style - Ruled Lines
    document.getElementById('toggle-lines').addEventListener('change', function() {
        hasRuledLines = this.checked;
        updatePaperStyle();
        saveSettings();
    });
    
    // Paper Style - Aged Effect
    document.getElementById('toggle-aged').addEventListener('change', function() {
        hasAgedEffect = this.checked;
        updatePaperStyle();
        saveSettings();
    });
    
    // Save Default Information
    document.getElementById('save-defaults').addEventListener('click', saveDefaultInfo);
    
    // Load saved settings
    loadSettings();
}

/**
 * Updates the selected font in the UI
 */
function updateFontSelection(selectedOption) {
    document.querySelectorAll('.font-option').forEach(option => {
        option.classList.remove('active');
    });
    selectedOption.classList.add('active');
}

/**
 * Updates the selected color in the UI
 */
function updateColorSelection(selectedOption) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
    });
    selectedOption.classList.add('active');
}

/**
 * Updates the preview with current font and color
 */
function updatePreviewStyle() {
    const preview = document.getElementById('application-content');
    preview.style.fontFamily = currentFont;
    preview.style.color = currentColor;
    preview.style.fontSize = '28px'; // Increased font size from 26px to 28px
    
    // Also update CSS variables for future reference
    document.documentElement.style.setProperty('--handwriting-font', currentFont);
    document.documentElement.style.setProperty('--handwriting-color', currentColor);
}

/**
 * Updates the paper style (ruled lines and aged effect)
 */
function updatePaperStyle() {
    const paper = document.getElementById('application-preview');
    
    // Toggle classes based on settings
    paper.classList.toggle('lined', hasRuledLines);
    paper.classList.toggle('aged', hasAgedEffect);
}

/**
 * Saves the current settings to localStorage
 */
function saveSettings() {
    const settings = {
        font: currentFont,
        color: currentColor,
        ruledLines: hasRuledLines,
        agedEffect: hasAgedEffect
    };
    
    localStorage.setItem('leaveAppSettings', JSON.stringify(settings));
}

/**
 * Loads settings from localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('leaveAppSettings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply saved settings
        currentFont = settings.font || "'Kalam', cursive";
        currentColor = settings.color || "#000000";
        hasRuledLines = settings.ruledLines || false;
        hasAgedEffect = settings.agedEffect || false;
        
        // Update UI
        document.getElementById('toggle-lines').checked = hasRuledLines;
        document.getElementById('toggle-aged').checked = hasAgedEffect;
        
        // Set active font
        document.querySelectorAll('.font-option').forEach(option => {
            if (option.getAttribute('data-font') === currentFont) {
                updateFontSelection(option);
            }
        });
        
        // Set active color
        document.querySelectorAll('.color-option').forEach(option => {
            if (option.getAttribute('data-color') === currentColor) {
                updateColorSelection(option);
            }
        });
        
        // Apply styles
        updatePreviewStyle();
        updatePaperStyle();
    }
}

/**
 * Saves default user information to localStorage
 */
function saveDefaultInfo() {
    const defaultName = document.getElementById('default-name').value;
    const defaultRoll = document.getElementById('default-roll').value;
    const defaultDepartment = document.getElementById('default-department').value;
    
    const defaultInfo = {
        name: defaultName,
        roll: defaultRoll,
        department: defaultDepartment
    };
    
    localStorage.setItem('leaveAppDefaults', JSON.stringify(defaultInfo));
    alert('Default information saved successfully!');
}

/**
 * Loads default user information from localStorage
 */
function loadDefaults() {
    const savedDefaults = localStorage.getItem('leaveAppDefaults');
    
    if (savedDefaults) {
        const defaults = JSON.parse(savedDefaults);
        
        // Set form values
        if (defaults.name) document.getElementById('studentName').value = defaults.name;
        if (defaults.roll) document.getElementById('rollNumber').value = defaults.roll;
        if (defaults.department) document.getElementById('department').value = defaults.department;
        
        // Set default info form values
        document.getElementById('default-name').value = defaults.name || '';
        document.getElementById('default-roll').value = defaults.roll || '';
        document.getElementById('default-department').value = defaults.department || '';
    }
}

/**
 * Sets the default date to today
 */
function setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('applicationDate').value = formattedDate;
}

/**
 * Formats a date object to a readable string format (e.g., "April 14, 2025")
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Generates the leave application based on the form data
 */
function generateApplication() {
    // Get common form data
    const studentName = document.getElementById('studentName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const department = document.getElementById('department').value;
    const applicationDate = document.getElementById('applicationDate').value;
    const templateType = document.getElementById('template').value;
    
    // Validate required fields
    if (!studentName || !rollNumber || !department || !applicationDate) {
        alert('Please fill in all required fields!');
        
        // Switch back to form tab
        document.querySelector('.tab-btn[data-tab="form"]').click();
        return;
    }
    
    // Get the content container
    const contentContainer = document.getElementById('application-content');
    let content = '';
    
    // To section at the top
    content += `<div class="application-to">
                    <div>The Head of Department</div>
                    <div>Department of ${department}</div>
                    <div>University of Swabi</div>
                </div>`;
    
    // Subject line
    let subject = '';
    switch(templateType) {
        case 'urgent':
            subject = 'Urgent piece of work';
            break;
        case 'sick':
            subject = 'Sick Leave';
            break;
        case 'emergency':
            subject = 'Family Emergency';
            break;
        case 'event':
            subject = 'Event Participation';
            break;
        case 'custom':
            subject = 'Leave Application';
            break;
        case 'fullCustom':
            // Use the custom subject provided by the user
            const customSubject = document.getElementById('customSubject').value;
            subject = customSubject || 'Leave Application';
            break;
    }
    
    content += `<div class="application-subject">
                    <strong>Subject:</strong> ${subject}
                </div>`;
    
    // Salutation
    content += '<div class="salutation">Respected Sir,</div>';
    
    // Content based on template type
    content += '<div class="application-body">';
    
    switch(templateType) {
        case 'urgent':
            const urgentDays = document.getElementById('urgentDays').value;
            const urgentDetails = document.getElementById('urgentDetails').value;
            
            content += `With due respect I beg to say that I have an urgent piece of work at home${urgentDetails ? `: ${urgentDetails}` : ''}. So I am unable to attend the classes ${urgentDays > 1 ? `for <span class="leave-duration-first">${urgentDays} days</span>` : '<span class="leave-duration-first">today</span>'}.<br><br>`;
            content += `Please kindly grant me leave ${urgentDays > 1 ? `for <span class="leave-duration">${urgentDays} days</span>` : 'for <span class="leave-duration">today</span>'}. I shall be very thankful to you for this act of kindness.`;
            break;
            
        case 'sick':
            const sickFromDate = document.getElementById('sickFromDate').value;
            const sickToDate = document.getElementById('sickToDate').value;
            const sickReason = document.getElementById('sickReason').value;
            
            content += `With due respect I beg to say that I am suffering from ${sickReason} and will not be able to attend classes <span class="leave-duration-first">from ${formatDate(sickFromDate)} to ${formatDate(sickToDate)}</span>. I have been advised to take rest during this period.<br><br>`;
            content += `Please kindly grant me leave for <span class="leave-duration">the mentioned period</span>. I shall be very thankful to you for this act of kindness.`;
            break;
            
        case 'emergency':
            const emergencyDays = document.getElementById('emergencyDays').value;
            const emergencyDetails = document.getElementById('emergencyDetails').value;
            
            content += `With due respect I beg to say that due to a family emergency${emergencyDetails ? `: ${emergencyDetails}` : ''}, I need to take leave ${emergencyDays > 1 ? `for <span class="leave-duration-first">${emergencyDays} days</span>` : 'for <span class="leave-duration-first">today</span>'}.<br><br>`;
            content += `Please kindly grant me leave ${emergencyDays > 1 ? `for <span class="leave-duration">${emergencyDays} days</span>` : 'for <span class="leave-duration">today</span>'}. I shall be very thankful to you for this act of kindness.`;
            break;
            
        case 'event':
            const eventName = document.getElementById('eventName').value;
            const eventFromDate = document.getElementById('eventFromDate').value;
            const eventToDate = document.getElementById('eventToDate').value;
            const eventDetails = document.getElementById('eventDetails').value;
            
            content += `With due respect I beg to say that I have been selected to participate in "${eventName}" which will be held <span class="leave-duration-first">from ${formatDate(eventFromDate)} to ${formatDate(eventToDate)}</span>. ${eventDetails}<br><br>`;
            content += `Please kindly grant me leave for <span class="leave-duration">the mentioned period</span>. I shall be very thankful to you for this act of kindness.`;
            break;
            
        case 'custom':
            const customDays = document.getElementById('customDays').value;
            const customReason = document.getElementById('customReason').value;
            
            content += `With due respect I beg to say that ${customReason}. So I am unable to attend the classes ${customDays > 1 ? `for <span class="leave-duration-first">${customDays} days</span>` : 'for <span class="leave-duration-first">today</span>'}.<br><br>`;
            content += `Please kindly grant me leave ${customDays > 1 ? `for <span class="leave-duration">${customDays} days</span>` : 'for <span class="leave-duration">today</span>'}. I shall be very thankful to you for this act of kindness.`;
            break;
            
        case 'fullCustom':
            const fullCustomText = document.getElementById('fullCustomText').value;
            
            // Add the custom text directly
            content += fullCustomText.replace(/\n/g, '<br>');
            break;
    }
    
    content += '</div>';
    
    // Signature on the right side
    content += `<div class="application-signature">
                    <div>Your's Obediently,</div>
                    ${signaturePad && !signaturePad.isEmpty() ? '<img class="signature-image" src="' + signaturePad.toDataURL() + '">' : '<div class="signature-placeholder"></div>'} 
                    <div>Name: ${studentName}</div>
                    <div>Roll No: ${rollNumber}</div>
                    <div>Date: ${formatDate(applicationDate)}</div>
                </div>`;
    
    // Set content
    contentContainer.innerHTML = content;
    
    // Apply styling
    updatePreviewStyle();
    updatePaperStyle();
}

/**
 * Saves the form data to localStorage
 */
function saveFormData() {
    const formData = {
        studentName: document.getElementById('studentName').value,
        rollNumber: document.getElementById('rollNumber').value,
        department: document.getElementById('department').value,
        applicationDate: document.getElementById('applicationDate').value,
        template: document.getElementById('template').value
    };
    
    // Add template-specific fields
    const templateType = document.getElementById('template').value;
    
    switch(templateType) {
        case 'urgent':
            formData.urgentDays = document.getElementById('urgentDays').value;
            formData.urgentDetails = document.getElementById('urgentDetails').value;
            break;
            
        case 'sick':
            formData.sickFromDate = document.getElementById('sickFromDate').value;
            formData.sickToDate = document.getElementById('sickToDate').value;
            formData.sickReason = document.getElementById('sickReason').value;
            break;
            
        case 'emergency':
            formData.emergencyDays = document.getElementById('emergencyDays').value;
            formData.emergencyDetails = document.getElementById('emergencyDetails').value;
            break;
            
        case 'event':
            formData.eventName = document.getElementById('eventName').value;
            formData.eventFromDate = document.getElementById('eventFromDate').value;
            formData.eventToDate = document.getElementById('eventToDate').value;
            formData.eventDetails = document.getElementById('eventDetails').value;
            break;
            
        case 'custom':
            formData.customDays = document.getElementById('customDays').value;
            formData.customReason = document.getElementById('customReason').value;
            break;
            
        case 'fullCustom':
            formData.fullCustomText = document.getElementById('fullCustomText').value;
            formData.customSubject = document.getElementById('customSubject').value;
            break;
    }
    
    // Save signature if present
    if (signaturePad && !signaturePad.isEmpty()) {
        formData.signature = signaturePad.toDataURL();
    }
    
    localStorage.setItem('leaveAppFormData', JSON.stringify(formData));
    alert('Form data saved successfully!');
}

/**
 * Loads the form data from localStorage
 */
function loadFormData() {
    const savedFormData = localStorage.getItem('leaveAppFormData');
    
    if (savedFormData) {
        const formData = JSON.parse(savedFormData);
        
        // Set common form values
        document.getElementById('studentName').value = formData.studentName || '';
        document.getElementById('rollNumber').value = formData.rollNumber || '';
        document.getElementById('department').value = formData.department || '';
        document.getElementById('applicationDate').value = formData.applicationDate || '';
        
        // Set template and show/hide fields
        const templateSelector = document.getElementById('template');
        templateSelector.value = formData.template || 'urgent';
        handleTemplateChange();
        
        // Set template-specific values
        switch(formData.template) {
            case 'urgent':
                document.getElementById('urgentDays').value = formData.urgentDays || '';
                document.getElementById('urgentDetails').value = formData.urgentDetails || '';
                break;
                
            case 'sick':
                document.getElementById('sickFromDate').value = formData.sickFromDate || '';
                document.getElementById('sickToDate').value = formData.sickToDate || '';
                document.getElementById('sickReason').value = formData.sickReason || '';
                break;
                
            case 'emergency':
                document.getElementById('emergencyDays').value = formData.emergencyDays || '';
                document.getElementById('emergencyDetails').value = formData.emergencyDetails || '';
                break;
                
            case 'event':
                document.getElementById('eventName').value = formData.eventName || '';
                document.getElementById('eventFromDate').value = formData.eventFromDate || '';
                document.getElementById('eventToDate').value = formData.eventToDate || '';
                document.getElementById('eventDetails').value = formData.eventDetails || '';
                break;
                
            case 'custom':
                document.getElementById('customDays').value = formData.customDays || '';
                document.getElementById('customReason').value = formData.customReason || '';
                break;
                
            case 'fullCustom':
                document.getElementById('fullCustomText').value = formData.fullCustomText || '';
                document.getElementById('customSubject').value = formData.customSubject || '';
                break;
        }
        
        // Load signature if present
        if (formData.signature && signaturePad) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('signature-pad');
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                signaturePad.clear();
                
                // Draw signature
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Update signature pad data
                setTimeout(() => {
                    if (signaturePad._isEmpty) {
                        signaturePad._data = signaturePad.toData();
                    }
                }, 100);
            };
            img.src = formData.signature;
        }
    }
}

/**
 * Clears all form data
 */
function clearFormData() {
    if (confirm('Are you sure you want to clear all form data?')) {
        document.getElementById('application-form').reset();
        signaturePad.clear();
        setDefaultDate();
        
        // Reset template fields
        document.getElementById('template').value = 'urgent';
        handleTemplateChange();
        
        // Remove from localStorage
        localStorage.removeItem('leaveAppFormData');
    }
}

/**
 * Triggers the browser's print functionality for the application
 */
function printApplication() {
    window.print();
}

/**
 * Downloads the application as a PDF using jsPDF and html2canvas
 */
function downloadAsPDF() {
    // Show loading indicator or message
    const downloadBtn = document.getElementById('download-pdf');
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;
    
    // Get student name and roll number for the filename
    const studentName = document.getElementById('studentName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    
    // Get the application preview element
    const element = document.getElementById('application-preview');
    
    // Use html2canvas to convert the application to an image
    html2canvas(element, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        // Create PDF using jsPDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Calculate dimensions to maintain aspect ratio
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const ratio = Math.min(pageWidth / canvasWidth, pageHeight / canvasHeight);
        const imgWidth = canvasWidth * ratio;
        const imgHeight = canvasHeight * ratio;
        
        const marginX = (pageWidth - imgWidth) / 2;
        
        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', marginX, 0, imgWidth, imgHeight);
        
        // Generate filename based on student info and date
        const today = new Date();
        const date = today.toISOString().slice(0, 10);
        let filename = `Leave_Application_${date}`;
        
        if (studentName) {
            filename = `${studentName}_Leave_Application_${date}`;
        }
        if (rollNumber) {
            filename = `${rollNumber}_${filename}`;
        }
        
        // Download the PDF
        pdf.save(`${filename}.pdf`);
        
        // Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please try again.');
        
        // Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    });
}

// Load form data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
});