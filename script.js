class BeforeAfterVideoGenerator {
    constructor() {
        this.beforeImage = null;
        this.afterImage = null;
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.beforeUpload = document.getElementById('beforeUpload');
        this.afterUpload = document.getElementById('afterUpload');
        this.beforeInput = document.getElementById('beforeInput');
        this.afterInput = document.getElementById('afterInput');
        this.beforePreview = document.getElementById('beforePreview');
        this.afterPreview = document.getElementById('afterPreview');
        this.generateBtn = document.getElementById('generateBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.statusMessage = document.getElementById('statusMessage');
        this.previewSection = document.getElementById('previewSection');
        this.previewVideo = document.getElementById('previewVideo');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    bindEvents() {
        this.beforeUpload.addEventListener('click', () => this.beforeInput.click());
        this.afterUpload.addEventListener('click', () => this.afterInput.click());
        
        this.beforeInput.addEventListener('change', (e) => this.handleImageUpload(e, 'before'));
        this.afterInput.addEventListener('change', (e) => this.handleImageUpload(e, 'after'));
        
        this.generateBtn.addEventListener('click', () => this.generateVideo());
        this.downloadBtn.addEventListener('click', () => this.downloadVideo());
    }

    handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (type === 'before') {
                    this.beforeImage = img;
                    this.beforePreview.src = e.target.result;
                    this.beforePreview.style.display = 'block';
                    this.beforeUpload.classList.add('active');
                } else {
                    this.afterImage = img;
                    this.afterPreview.src = e.target.result;
                    this.afterPreview.style.display = 'block';
                    this.afterUpload.classList.add('active');
                }
                this.checkCanGenerate();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    checkCanGenerate() {
        const canGenerate = this.beforeImage && this.afterImage;
        this.generateBtn.disabled = !canGenerate;
        if (canGenerate) {
            this.generateBtn.classList.add('pulse');
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message status-${type}`;
        this.statusMessage.style.display = 'block';
        this.statusMessage.classList.add('fade-in');
    }

    hideStatus() {
        this.statusMessage.style.display = 'none';
    }

    showAppSection() {
        const appSection = document.getElementById('appSection');
        if (appSection) {
            // Add a slight delay for better UX
            setTimeout(() => {
                appSection.style.display = 'block';
                appSection.classList.add('fade-in');
            }, 1000);
        }
    }

    // Get the best available MIME type for MP4 recording
    getSupportedMimeType() {
        const types = [
            'video/mp4;codecs=h264',
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        // Fallback to default
        return 'video/webm';
    }

    async generateVideo() {
        try {
            this.generateBtn.disabled = true;
            this.loadingSpinner.style.display = 'block';
            this.hideStatus();
            this.previewSection.style.display = 'none';

            // Get settings
            const aspectRatio = document.querySelector('input[name="aspectRatio"]:checked').value;
            const addText = document.getElementById('addText').checked;
            
            const dimensions = aspectRatio === '9x16' 
                ? { width: 2160, height: 3840 }
                : { width: 2160, height: 2700 };

            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = dimensions.width;
            this.canvas.height = dimensions.height;
            this.ctx = this.canvas.getContext('2d');

            // Setup MediaRecorder with best available format
            const stream = this.canvas.captureStream(30);
            const mimeType = this.getSupportedMimeType();
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 8000000 // 8 Mbps for high quality
            });

            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                this.previewVideo.src = url;
                this.previewSection.style.display = 'block';
                this.previewSection.classList.add('fade-in');
                this.loadingSpinner.style.display = 'none';
                this.showStatus('Video generated successfully!', 'success');
                this.generateBtn.disabled = false;

                // Show Halationify section after video generation
                this.showAppSection();
            };

            // Start recording
            this.mediaRecorder.start();

            // Animate for 4 seconds (120 frames at 30fps) for smoother movement
            await this.animateFrames(dimensions, addText, 120);

            // Stop recording
            this.mediaRecorder.stop();

        } catch (error) {
            console.error('Error generating video:', error);
            this.showStatus('Error generating video. Please try again.', 'error');
            this.loadingSpinner.style.display = 'none';
            this.generateBtn.disabled = false;
        }
    }

    async animateFrames(dimensions, addText, totalFrames) {
        const margin = 100;
        const imageArea = {
            width: dimensions.width - (margin * 2),
            height: dimensions.height - (margin * 2) - (addText ? 150 : 0)
        };

        // Calculate image dimensions maintaining aspect ratio
        const beforeAspect = this.beforeImage.width / this.beforeImage.height;
        const containerAspect = imageArea.width / imageArea.height;

        let imgWidth, imgHeight, imgX, imgY;

        if (beforeAspect > containerAspect) {
            // Image is wider than container - fit to width
            imgWidth = imageArea.width;
            imgHeight = imageArea.width / beforeAspect;
            imgX = margin;
            // Center vertically within the available image area
            imgY = margin + (imageArea.height - imgHeight) / 2;
        } else {
            // Image is taller than container - fit to height
            imgHeight = imageArea.height;
            imgWidth = imageArea.height * beforeAspect;
            // Center horizontally
            imgX = (dimensions.width - imgWidth) / 2;
            imgY = margin;
        }

        for (let frame = 0; frame < totalFrames; frame++) {
            // Clear canvas with white background
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            // Calculate line position for perfect looping
            // Using a cosine wave that starts and ends at 0 (left side)
            // This creates: left -> right -> left -> right -> left (perfectly looped)
            const normalizedTime = frame / totalFrames; // 0 to 1
            const cycles = 2; // Number of complete back-and-forth cycles
            const progress = (1 - Math.cos(normalizedTime * Math.PI * 2 * cycles)) / 2;
            const lineX = imgX + (imgWidth * progress);

            // Draw before image (full image)
            this.ctx.drawImage(this.beforeImage, imgX, imgY, imgWidth, imgHeight);

            // Clip and draw after image (only the part to the right of the line)
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(lineX, imgY, imgWidth - (lineX - imgX), imgHeight);
            this.ctx.clip();
            this.ctx.drawImage(this.afterImage, imgX, imgY, imgWidth, imgHeight);
            this.ctx.restore();

            // Draw the white dividing line with some thickness and shadow for better visibility
            const lineWidth = 8;
            
            // Draw shadow/outline for the line
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.lineWidth = lineWidth + 4;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, imgY - 10);
            this.ctx.lineTo(lineX, imgY + imgHeight + 10);
            this.ctx.stroke();

            // Draw the main white line
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, imgY - 10);
            this.ctx.lineTo(lineX, imgY + imgHeight + 10);
            this.ctx.stroke();

            // Add subtle glow effect to the line
            this.ctx.shadowColor = 'white';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, imgY - 5);
            this.ctx.lineTo(lineX, imgY + imgHeight + 5);
            this.ctx.stroke();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            // // Add circular indicators at the top and bottom of the line for better visibility
            // const circleRadius = 12;
            
            // // Top circle
            // this.ctx.fillStyle = 'white';
            // this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            // this.ctx.lineWidth = 2;
            // this.ctx.beginPath();
            // this.ctx.arc(lineX, imgY - 20, circleRadius, 0, Math.PI * 2);
            // this.ctx.fill();
            // this.ctx.stroke();

            // // Bottom circle
            // this.ctx.beginPath();
            // this.ctx.arc(lineX, imgY + imgHeight + 20, circleRadius, 0, Math.PI * 2);
            // this.ctx.fill();
            // this.ctx.stroke();

            // // Add arrows in the circles to indicate direction
            // this.ctx.fillStyle = '#666';
            // this.ctx.font = 'bold 16px Arial';
            // this.ctx.textAlign = 'center';
            // this.ctx.textBaseline = 'middle';
            
            // // Calculate direction based on the derivative of the cosine function
            // const prevNormalizedTime = Math.max(0, (frame - 1) / totalFrames);
            // const prevProgress = (1 - Math.cos(prevNormalizedTime * Math.PI * 2 * cycles)) / 2;
            // const direction = progress > prevProgress ? '→' : '←';
            
            // this.ctx.fillText(direction, lineX, imgY - 20);
            // this.ctx.fillText(direction, lineX, imgY + imgHeight + 20);

            // Add text if enabled
            if (addText) {
                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 100px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const textY = dimensions.height - 120;
                this.ctx.fillText('LR PRESETS LINKED IN BIO', dimensions.width / 2, textY);
            }

            // Wait for next frame
            await new Promise(resolve => setTimeout(resolve, 1000 / 30));
        }
    }

    downloadVideo() {
        if (this.recordedChunks.length === 0) return;

        // Determine the MIME type that was used for recording
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Use .mp4 extension regardless of the actual format for better compatibility
        a.download = `before-after-${Date.now()}.mp4`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('Video downloaded successfully!', 'success');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeforeAfterVideoGenerator();
});