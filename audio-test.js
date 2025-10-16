class AudioTest {
    constructor() {
        this.isPlaying = false;
        this.currentQuestion = 1;
        this.currentSubQuestion = 1;
        this.countdownTime = 0;
        this.currentQuestionFiles = [];
        this.countdownTimer = null;
        this.usedFolders = {
            2: [], // Câu 2-10
            3: [], // Câu 11-13
            4: []  // Câu 14-15
        };
        this.playlist = [];
        this.logEntries = [];
        
        // CẤU TRÚC THƯ MỤC THỰC TẾ CỦA BẠN
        this.audioFolders = {
            "câu 1": ["c1.mp3"],
            "câu 2": [
                "Việc nhà", "Tiệm tóc", "Thời trang", "Thời tiết", "Thiết bị", 
                "Thăm hỏi", "Sức khỏe", "Shoping", "Phim ảnh", "Nông dân", 
                "Nhà hàng", "Nhà", "Người nổi tiếng", "Ngày nghỉ lễ", "Ngân hàng", "Món ăn", "Liên lạc", "Khách sạn",
                "Internet", "Hoạt động vào thời gian rảnh", "Giấy tờ tùy thân", "Giao thông", "Du lịch 1", "Đồ nội thất", "Đồ điện",
                "Địa hình", "Đi bộ 1", "Đi bộ 2", "Đặt trước", "Công viên", "Công việc", "Cảnh sát", "Bệnh viện", "Âm nhạc"
            ],
            "câu 3": [
                "Phim ảnh", "Shoping", "Thiết bị 1", "Thiết bị 2", "Tiệm tóc", 
                "internet", "Khách sạn", "Ngân hàng", "Nhà", "Nhà hàng", 
                "Giẩy tờ tùy thân", "Du lịch", "Đồ nội thất", "Đồ điện", "công viên", "Bệnh viện"
            ],
            "câu 4": [
                "Âm nhạc", "Bệnh viện", "Công viên", "Đi bộ", "Địa hình", 
                "du lịch", "Giấy tờ tùy thân", "Người nổi tiếng", "Nhà", "Nhà 2", 
                "Nhà hàng", "Phim ảnh"
            ]
        };

        this.initializeEventListeners();
        this.updateStatus();
        this.writeLog("Ứng dụng đã khởi tạo. Hỗ trợ thời gian chờ từ tên file!");
    }

    initializeEventListeners() {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.addEventListener('ended', () => this.handleAudioEnded());
    }

    async checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    startTest() {
        this.writeLog("=== BẮT ĐẦU BÀI THI ===");
        
        this.currentQuestion = 1;
        this.currentSubQuestion = 1;
        this.isPlaying = true;
        
        this.usedFolders[2] = [];
        this.usedFolders[3] = [];
        this.usedFolders[4] = [];
        
        this.updateControls();
        this.playQuestion();
    }

    stopTest() {
        this.writeLog("=== DỪNG BÀI THI ===");
        this.stopAll();
        this.isPlaying = false;
        this.updateControls();
    }

    nextQuestion() {
        this.writeLog(`NGƯỜI DÙNG NHẤN NEXT - Câu ${this.currentQuestion}.${this.currentSubQuestion}`);
        
        // Nếu CHƯA phát hết file trong câu hiện tại → chuyển file tiếp theo trong cùng câu
        if (this.currentSubQuestion < this.currentQuestionFiles.length) {
            this.writeLog(`Chuyển sang file tiếp theo trong câu ${this.currentQuestion}`);
            this.skipToNextSubQuestion();
        } 
        // Nếu đã phát đến file CUỐI cùng của câu → chuyển sang câu tiếp theo
        else {
            this.writeLog(`Đã phát hết file trong câu ${this.currentQuestion}, chuyển sang câu tiếp theo`);
            this.skipToNextQuestion();
        }
    }

    skipToNextSubQuestion() {
        this.stopAll();
        this.writeLog(`BỎ QUA file ${this.currentQuestion}.${this.currentSubQuestion}`);
        
        this.currentSubQuestion++;
        this.playCurrentSubQuestion();
    }

    skipToNextQuestion() {
        this.stopAll();
        this.writeLog(`BỎ QUA câu ${this.currentQuestion}`);

        if (this.currentQuestion >= 15) {
            this.writeLog("=== KẾT THÚC BÀI THI (BẰNG NEXT) ===");
            alert("KẾT THÚC BÀI THI!");
            this.isPlaying = false;
            this.updateControls();
            return;
        }

        this.currentQuestion++;
        this.currentSubQuestion = 1;
        this.currentQuestionFiles = [];

        this.writeLog(`CHUYỂN SANG câu ${this.currentQuestion}`);
        this.playQuestion();
    }

    stopAll() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        this.stopAudio();
    }

    stopAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    playQuestion() {
        this.updateStatus();
        this.writeLog(`Bắt đầu câu hỏi ${this.currentQuestion}`);

        if (this.currentQuestion > 15) {
            this.writeLog("=== KẾT THÚC BÀI THI ===");
            alert("KẾT THÚC BÀI THI!");
            this.isPlaying = false;
            this.updateControls();
            return;
        }

        if (this.currentQuestion === 1) {
            this.playQuestion1();
        } else if (this.currentQuestion >= 2 && this.currentQuestion <= 10) {
            this.playQuestion2To10();
        } else if (this.currentQuestion >= 11 && this.currentQuestion <= 13) {
            this.playQuestion11To13();
        } else if (this.currentQuestion >= 14 && this.currentQuestion <= 15) {
            this.playQuestion14To15();
        }
    }

    async playQuestion1() {
        // Tìm file c1 với các biến thể tên
        const possibleFiles = ["c1.mp3", "c1(60).mp3", "c1(90).mp3", "c1(120).mp3"];
        let foundFile = null;

        for (const file of possibleFiles) {
            const filePath = this.getAudioPath("câu 1", null, file);
            const fileExists = await this.checkFileExists(filePath);
            if (fileExists) {
                foundFile = filePath;
                this.writeLog(`Câu 1: Tìm thấy file ${file}`);
                break;
            }
        }

        if (foundFile) {
            this.currentQuestionFiles = [foundFile];
            await this.playCurrentSubQuestion();
        } else {
            this.writeLog(`LỖI: Không tìm thấy file câu 1`);
            alert(`LỖI: Không tìm thấy file câu 1!`);
            this.skipToNextQuestion();
        }
    }

    playQuestion2To10() {
        this.loadRandomFolder("câu 2", 2);
    }

    playQuestion11To13() {
        this.loadRandomFolder("câu 3", 3);
    }

    playQuestion14To15() {
        this.loadRandomFolder("câu 4", 4);
    }

    loadRandomFolder(questionFolder, questionType) {
        const availableFolders = this.audioFolders[questionFolder].filter(folder => 
            !this.usedFolders[questionType].includes(folder)
        );

        if (availableFolders.length === 0) {
            this.writeLog(`LỖI: Đã dùng hết thư mục cho câu ${this.currentQuestion}`);
            alert("Đã dùng hết thư mục cho câu hỏi này!");
            this.skipToNextQuestion();
            return;
        }

        const randomFolder = availableFolders[Math.floor(Math.random() * availableFolders.length)];
        this.usedFolders[questionType].push(randomFolder);

        this.writeLog(`Câu ${this.currentQuestion}: Chọn thư mục ${randomFolder}`);
        this.loadQuestionFiles(questionFolder, randomFolder);
    }

    loadQuestionFiles(questionFolder, folderName) {
        this.currentQuestionFiles = [];
        this.writeLog(`THƯ MỤC ĐƯỢC CHỌN: ${folderName}`);

        // Danh sách file có thể có (hỗ trợ cả tên file cũ và mới)
        const possibleFiles = [
            "c1.mp3", "c1(60).mp3", "c1(90).mp3", "c1(120).mp3",
            "c2.mp3", "c2(60).mp3", "c2(90).mp3", "c2(120).mp3", 
            "c3.mp3", "c3(60).mp3", "c3(90).mp3", "c3(120).mp3",
            "c4.mp3", "c4(60).mp3", "c4(90).mp3", "c4(120).mp3"
        ];

        // Tìm file thực tế tồn tại
        const foundFiles = [];
        
        // Tìm c1 (ưu tiên file có thời gian)
        const c1Files = possibleFiles.filter(f => f.startsWith('c1'));
        for (const file of c1Files) {
            const path = this.getAudioPath(questionFolder, folderName, file);
            foundFiles.push({ name: 'c1', path: path, fileName: file });
            break; // Chỉ lấy file c1 đầu tiên tìm thấy
        }

        // Tìm c2
        const c2Files = possibleFiles.filter(f => f.startsWith('c2'));
        for (const file of c2Files) {
            const path = this.getAudioPath(questionFolder, folderName, file);
            foundFiles.push({ name: 'c2', path: path, fileName: file });
            break;
        }

        // Random chọn giữa c3 và c4
        const c3Files = possibleFiles.filter(f => f.startsWith('c3'));
        const c4Files = possibleFiles.filter(f => f.startsWith('c4'));
        
        const c3File = c3Files.length > 0 ? 
            { name: 'c3', path: this.getAudioPath(questionFolder, folderName, c3Files[0]), fileName: c3Files[0] } : null;
        const c4File = c4Files.length > 0 ? 
            { name: 'c4', path: this.getAudioPath(questionFolder, folderName, c4Files[0]), fileName: c4Files[0] } : null;
        
        if (c3File && c4File) {
            const selected = Math.random() < 0.5 ? c3File : c4File;
            foundFiles.push(selected);
            this.writeLog(`RANDOM CHỌN: ${selected.fileName}`);
        } else if (c3File) {
            foundFiles.push(c3File);
        } else if (c4File) {
            foundFiles.push(c4File);
        }

        // Sắp xếp theo thứ tự
        const sortedFiles = [];
        sortedFiles.push(...foundFiles.filter(f => f.name === 'c1'));
        sortedFiles.push(...foundFiles.filter(f => f.name === 'c2'));
        sortedFiles.push(...foundFiles.filter(f => f.name === 'c3' || f.name === 'c4'));

        this.currentQuestionFiles = sortedFiles.map(f => f.path);

        // Log chi tiết
        this.writeLog(`TÌM THẤY ${sortedFiles.length} FILE:`);
        sortedFiles.forEach(file => {
            this.writeLog(`- ${file.fileName}`);
        });

        this.currentSubQuestion = 1;
        this.playCurrentSubQuestion();
    }

    async playCurrentSubQuestion() {
        if (this.currentSubQuestion > this.currentQuestionFiles.length) {
            this.skipToNextQuestion();
            return;
        }

        const filePath = this.currentQuestionFiles[this.currentSubQuestion - 1];
        const fileName = this.getFileNameFromPath(filePath);
        
        this.writeLog(`Câu ${this.currentQuestion}.${this.currentSubQuestion}: Phát file ${fileName} lần 1`);
        
        // Phát lần 1
        await this.playAudioFile(filePath);
        
        // Phát lần 2
        this.writeLog(`Câu ${this.currentQuestion}.${this.currentSubQuestion}: Phát file ${fileName} lần 2`);
        await this.playAudioFile(filePath);

        // Lấy thời gian chờ TỰ ĐỘNG từ tên file
        const waitTime = this.extractWaitTimeFromFileName(fileName);
        this.writeLog(`Câu ${this.currentQuestion}.${this.currentSubQuestion}: Bắt đầu đếm ngược ${waitTime} giây (từ tên file)`);
        this.startCountdown(waitTime);
    }

    // HÀM MỚI: trích xuất thời gian chờ từ tên file
    extractWaitTimeFromFileName(fileName) {
        // Tìm số trong ngoặc đơn: c1(60).mp3 → 60
        const match = fileName.match(/\((\d+)\)/);
        
        if (match && match[1]) {
            const waitTime = parseInt(match[1]);
            this.writeLog(`ĐỌC THỜI GIAN CHỜ: ${fileName} → ${waitTime} giây`);
            return waitTime;
        } else {
            // Fallback: nếu không tìm thấy số trong ngoặc, dùng giá trị mặc định
            const defaultTime = this.getDefaultWaitTime();
            this.writeLog(`KHÔNG TÌM THẤY THỜI GIAN: ${fileName}, dùng mặc định: ${defaultTime} giây`);
            return defaultTime;
        }
    }

    // Fallback: thời gian chờ mặc định
    getDefaultWaitTime() {
        if (this.currentQuestion === 1) return 60;

        if (this.currentQuestion >= 2 && this.currentQuestion <= 10) {
            switch (this.currentSubQuestion) {
                case 1: return 60;
                case 2: return 60;
                case 3: return 120;
                default: return 60;
            }
        }

        if (this.currentQuestion >= 11 && this.currentQuestion <= 13) {
            switch (this.currentSubQuestion) {
                case 1: return 90;
                case 2: return 120;
                case 3: return 120;
                default: return 90;
            }
        }

        if (this.currentQuestion >= 14 && this.currentQuestion <= 15) {
            return 60;
        }

        return 60;
    }

    async playAudioFile(filePath) {
        return new Promise(async (resolve) => {
            const audioPlayer = document.getElementById('audioPlayer');
            
            const fileExists = await this.checkFileExists(filePath);
            
            if (!fileExists) {
                this.writeLog(`LỖI: File không tồn tại - ${filePath}`);
                document.getElementById('lblCurrentFile').textContent = `LỖI: File không tồn tại`;
                resolve();
                return;
            }
            
            audioPlayer.src = filePath;
            
            this.writeLog(`BẮT ĐẦU PHÁT: ${this.getFileNameFromPath(filePath)}`);
            document.getElementById('lblCurrentFile').textContent = `Đang phát: ${this.getFileNameFromPath(filePath)}`;
            
            audioPlayer.onended = () => {
                this.writeLog(`KẾT THÚC PHÁT: ${this.getFileNameFromPath(filePath)}`);
                resolve();
            };
            
            audioPlayer.onerror = (error) => {
                this.writeLog(`LỖI PHÁT AUDIO: ${error.target.error.message}`);
                document.getElementById('lblCurrentFile').textContent = `Lỗi phát audio`;
                resolve();
            };
            
            try {
                await audioPlayer.play();
            } catch (error) {
                this.writeLog(`LỖI KHI PHÁT: ${error.message}`);
                resolve();
            }
        });
    }

    handleAudioEnded() {
        // Xử lý khi audio kết thúc
    }

    startCountdown(seconds) {
        this.countdownTime = seconds;
        this.updateCountdownDisplay();
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(() => {
            this.countdownTime--;
            this.updateCountdownDisplay();
            
            if (this.countdownTime <= 0) {
                clearInterval(this.countdownTimer);
                this.playNextSubQuestion();
            }
        }, 1000);
    }

    playNextSubQuestion() {
        // Thay vì luôn tăng subQuestion, kiểm tra xem còn file không
        if (this.currentSubQuestion < this.currentQuestionFiles.length) {
            this.skipToNextSubQuestion();  // Chuyển file tiếp theo trong câu
        } else {
            this.skipToNextQuestion();     // Chuyển sang câu mới
        }
    }

    getAudioPath(questionFolder, folderName, fileName) {
        let path;
        
        if (folderName && fileName) {
            path = `audio/${questionFolder}/${folderName}/${fileName}`;
        } else if (fileName) {
            path = `audio/${questionFolder}/${fileName}`;
        }
        
        return path;
    }

    getFileNameFromPath(path) {
        return path.split('/').pop() || path;
    }

    updateCountdownDisplay() {
        document.getElementById('lblCountdown').textContent = `Đếm ngược: ${this.countdownTime}s`;
        const maxTime = 120;
        const progressPercent = (this.countdownTime / maxTime) * 100;
        document.getElementById('progressBar').style.width = `${progressPercent}%`;
        
        const progressBar = document.getElementById('progressBar');
        if (this.countdownTime < 30) {
            progressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a24)';
        } else if (this.countdownTime < 60) {
            progressBar.style.background = 'linear-gradient(90deg, #ffd93d, #ff9a3d)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #00b09b, #96c93d)';
        }
    }

    updateStatus() {
        document.getElementById('lblStatus').textContent = 
            `Câu hỏi: ${this.currentQuestion}/15 - File: ${this.currentSubQuestion}/${this.currentQuestionFiles.length}`;
    }

    updateControls() {
        document.getElementById('btnStart').disabled = this.isPlaying;
        document.getElementById('btnStop').disabled = !this.isPlaying;
        document.getElementById('btnNext').disabled = !this.isPlaying;
    }

    writeLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logEntries.push(logEntry);
        
        const logContainer = document.getElementById('logContainer');
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        logElement.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-message">${message}</span>`;
        logContainer.appendChild(logElement);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        if (this.logEntries.length > 50) {
            this.logEntries.shift();
            if (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.firstChild);
            }
        }
        
        console.log(logEntry);
    }

    exportPlaylist() {
        const playlistContent = "=== DANH SÁCH FILE AUDIO ĐÃ PHÁT ===\n" +
                               `Thời gian: ${new Date().toLocaleString()}\n\n` +
                               this.logEntries.join('\n');
        
        const blob = new Blob([playlistContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `playlist_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.writeLog("ĐÃ EXPORT PLAYLIST");
        alert("Đã export danh sách file audio!");
    }

    viewLog() {
        const logWindow = window.open('', '_blank', 'width=800,height=600');
        logWindow.document.write(`
            <html>
                <head><title>Audio Test Log</title></head>
                <body style="font-family: monospace; padding: 20px;">
                    <h2>Audio Test Log</h2>
                    <pre>${this.logEntries.join('\n')}</pre>
                </body>
            </html>
        `);
    }
}

// Khởi tạo ứng dụng
const audioTest = new AudioTest();