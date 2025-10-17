
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
                this.displayQuestionIndex = 1; // 🟢 để hiển thị số câu hỏi tổng hợp

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
                   document.getElementById('btnStart').addEventListener('click', () => this.showLoginModal());
    document.getElementById('btnStop').addEventListener('click', () => this.stopTest());
    document.getElementById('btnNext').addEventListener('click', () => this.nextQuestion());
    document.getElementById('btnExport').addEventListener('click', () => this.exportPlaylist());
    document.getElementById('btnLog').addEventListener('click', () => this.viewLog());

                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.addEventListener('ended', () => this.handleAudioEnded());

                 // Nút trong modal
                    document.getElementById('btnLoginConfirm').addEventListener('click', () => this.handleLogin());
                    document.getElementById('btnLoginCancel').addEventListener('click', () => this.closeLoginModal());
            }

            async checkFileExists(url) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    return response.status === 200;
                } catch (error) {
                    console.log(`Lỗi khi kiểm tra file ${url}:`, error);
                    return false;
                }
            }
           
            showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async handleLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const message = document.getElementById('loginMessage');

    if (!user || !password) {
        message.textContent = "⚠️ Vui lòng nhập tài khoản và mật khẩu.";
        return;
    }

    message.textContent = "🔄 Đang kiểm tra tài khoản...";

    try {
        // 🔹 Gọi API Google Sheet thông qua opensheet
        const sheetId = "1yxtqSjrgVBa3dgk3to9ytc9F5J3-nWehXjgQdOgbqrI";
        const sheetName = "taikhoan"; // thay bằng tên sheet thực tế
        const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Không thể kết nối Google Sheet");

        const sheetData = await response.json();

        // 🔍 Kiểm tra thông tin đăng nhập
        const found = sheetData.find(row =>
            row.USERID === user && row.PW === password
        );

        if (found) {
            message.textContent = "✅ Đăng nhập thành công!";
            // Ẩn modal nếu có
            if (typeof $ !== 'undefined' && $('#loginModal').length) {
                $('#loginModal').modal('hide');
                $('#loginModal').hide();
            }
               // Xóa backdrop nếu còn sót
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            // Bắt đầu bài test
            this.startTest();
        } else {
            message.textContent = "❌ Sai tài khoản hoặc mật khẩu.";
        }

    } catch (error) {
        console.error("Lỗi:", error);
        message.textContent = "❌ Không thể tải dữ liệu hoặc lỗi mạng.";
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
    this.writeLog(`NEXT - Câu ${this.currentQuestion}.${this.currentSubQuestion}`);

    if (this.currentSubQuestion < this.currentQuestionFiles.length) {
        this.skipToNextSubQuestion(); // chuyển sang file tiếp theo cùng thư mục
    } else {
        this.skipToNextQuestion(); // chuyển nhóm mới
    }
}


            skipToNextSubQuestion() {
                //this.stopAll();
                this.writeLog(`BỎ QUA file ${this.currentQuestion}.${this.currentSubQuestion}`);
                
               this.stopAll();
    this.currentSubQuestion++;
    this.displayQuestionIndex++; // 🟢 tăng số câu tổng hợp
    this.updateStatus();
    this.playCurrentSubQuestion();
            }

           skipToNextQuestion() {
  this.stopAll();

    // Xác định bước nhảy
    let step = 1;
    if (this.currentQuestion >= 1 && this.currentQuestion <= 1) step = 1;
    else if (this.currentQuestion >= 2 && this.currentQuestion <= 10) step = 3;
    else if (this.currentQuestion >= 11 && this.currentQuestion <= 13) step = 3;
    else if (this.currentQuestion >= 14 && this.currentQuestion <= 15) step = 2;

    this.currentQuestion += step;
    this.currentSubQuestion = 1;
    this.currentQuestionFiles = [];
    this.displayQuestionIndex++; // tăng câu tổng hợp
    this.updateStatus();

    // Kiểm tra kết thúc
    if (this.currentQuestion > 15) {
        this.writeLog("=== KẾT THÚC BÀI THI ===");
        alert("KẾT THÚC BÀI THI!");
        this.isPlaying = false;
        this.updateControls();
        return;
    }

    this.writeLog(`CHUYỂN SANG CÂU ${this.currentQuestion}`);
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
        this.playGroupQuestion("câu 2", 2, 3); // 3 thư mục, mỗi thư mục 3 file
    } else if (this.currentQuestion >= 11 && this.currentQuestion <= 13) {
        this.playGroupQuestion("câu 3", 3, 1); // 1 thư mục, 3 file
    } else if (this.currentQuestion >= 14 && this.currentQuestion <= 15) {
        this.playGroupQuestion("câu 4", 4, 1); // 1 thư mục, 2 file
    }
}
async playGroupQuestion(questionFolder, questionType, numFolders) {
    // Nếu chưa khởi tạo danh sách thư mục cho nhóm này thì tạo
    if (!this.groupFolders) this.groupFolders = {};
    if (!this.groupFolders[questionType]) this.groupFolders[questionType] = [];

    // Nếu chưa random đủ thư mục → random thêm
    while (this.groupFolders[questionType].length < numFolders) {
        const available = this.audioFolders[questionFolder].filter(f => 
            !this.usedFolders[questionType].includes(f)
        );
        if (available.length === 0) {
            this.writeLog(`Không còn thư mục khả dụng cho ${questionFolder}`);
            break;
        }
        const randomFolder = available[Math.floor(Math.random() * available.length)];
        this.usedFolders[questionType].push(randomFolder);
        this.groupFolders[questionType].push(randomFolder);
    }

    // Xác định đang ở thư mục nào
    const currentFolderIndex = Math.floor(
        (this.currentQuestion - (questionType === 2 ? 2 : questionType === 3 ? 11 : 14)) / 
        (questionType === 2 ? 3 : questionType === 3 ? 3 : 2)
    );
    const folderName = this.groupFolders[questionType][currentFolderIndex];

    this.writeLog(`Câu ${this.currentQuestion}: chọn thư mục ${folderName}`);
    await this.loadQuestionFilesByGroup(questionFolder, folderName, questionType);
}
async loadQuestionFilesByGroup(questionFolder, folderName, questionType) {
    this.currentQuestionFiles = [];

    const possibleFiles = {
        'c1': ["c1(60).mp3", "c1(90).mp3", "c1(120).mp3", "c1.mp3"],
        'c2': ["c2(60).mp3", "c2(90).mp3", "c2(120).mp3", "c2.mp3"],
        'c3': ["c3(60).mp3", "c3(90).mp3", "c3(120).mp3", "c3.mp3"],
        'c4': ["c4(60).mp3", "c4(90).mp3", "c4(120).mp3", "c4.mp3"]
    };

    const foundFiles = [];

    // 2–10 và 11–13 cần 3 file (c1,c2,c3)
    // 14–15 cần 2 file (c1,c2)
    if (questionType === 2 || questionType === 3) {
        await this.findAndAddFile(questionFolder, folderName, possibleFiles.c1, 'c1', foundFiles);
        await this.findAndAddFile(questionFolder, folderName, possibleFiles.c2, 'c2', foundFiles);
        await this.findAndAddFile(questionFolder, folderName, possibleFiles.c3, 'c3', foundFiles);
    } else if (questionType === 4) {
        await this.findAndAddFile(questionFolder, folderName, possibleFiles.c1, 'c1', foundFiles);
        await this.findAndAddFile(questionFolder, folderName, possibleFiles.c2, 'c2', foundFiles);
    }

    this.currentQuestionFiles = foundFiles.map(f => f.path);

    if (this.currentQuestionFiles.length === 0) {
        alert(`Không tìm thấy file audio trong ${folderName}`);
        this.skipToNextQuestion();
        return;
    }

    this.currentSubQuestion = 1;
    this.playCurrentSubQuestion();
}

         async playQuestion1() {
    const possibleFiles = ["c1(60).mp3", "c1(90).mp3", "c1(120).mp3", "c1.mp3"];
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
        this.currentSubQuestion = 1;

        // Phát file đầu tiên
        await this.playCurrentSubQuestion();

        // ✅ Sau khi phát xong, bắt đầu đếm ngược
        const waitTime = this.getWaitTimeForQuestion(1); // có thể là 60 / 90 / 120
        this.writeLog(`Chờ ${waitTime} giây trước khi sang câu tiếp theo...`);

        this.startCountdown(waitTime, () => {
            // ✅ Sau khi đếm xong, chuyển sang câu 2
            this.skipToNextQuestion();
        });
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

            async loadRandomFolder(questionFolder, questionType) {
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
                await this.loadQuestionFiles(questionFolder, randomFolder);
            }

            async loadQuestionFiles(questionFolder, folderName) {
                this.currentQuestionFiles = [];
                this.writeLog(`THƯ MỤC ĐƯỢC CHỌN: ${folderName}`);

                // Danh sách file có thể có - ƯU TIÊN FILE CÓ THỜI GIAN TRƯỚC
                const possibleFiles = {
                    'c1': ["c1(60).mp3", "c1(90).mp3", "c1(120).mp3", "c1.mp3"],
                    'c2': ["c2(60).mp3", "c2(90).mp3", "c2(120).mp3", "c2.mp3"],
                    'c3': ["c3(60).mp3", "c3(90).mp3", "c3(120).mp3", "c3.mp3"],
                    'c4': ["c4(60).mp3", "c4(90).mp3", "c4(120).mp3", "c4.mp3"]
                };

                // Tìm file thực tế tồn tại
                const foundFiles = [];
                
                // Tìm c1 (thử tất cả biến thể)
                await this.findAndAddFile(questionFolder, folderName, possibleFiles.c1, 'c1', foundFiles);
                
                // Tìm c2
                await this.findAndAddFile(questionFolder, folderName, possibleFiles.c2, 'c2', foundFiles);
                
                // Random chọn giữa c3 và c4
                const c3Found = await this.findFile(questionFolder, folderName, possibleFiles.c3);
                const c4Found = await this.findFile(questionFolder, folderName, possibleFiles.c4);
                
                if (c3Found && c4Found) {
                    const selected = Math.random() < 0.5 ? 
                        { name: 'c3', path: c3Found.path, fileName: c3Found.fileName } : 
                        { name: 'c4', path: c4Found.path, fileName: c4Found.fileName };
                    foundFiles.push(selected);
                    this.writeLog(`RANDOM CHỌN: ${selected.fileName}`);
                } else if (c3Found) {
                    foundFiles.push({ name: 'c3', path: c3Found.path, fileName: c3Found.fileName });
                } else if (c4Found) {
                    foundFiles.push({ name: 'c4', path: c4Found.path, fileName: c4Found.fileName });
                }

                // Sắp xếp theo thứ tự c1, c2, c3/c4
                const sortedFiles = [];
                sortedFiles.push(...foundFiles.filter(f => f.name === 'c1'));
                sortedFiles.push(...foundFiles.filter(f => f.name === 'c2'));
                sortedFiles.push(...foundFiles.filter(f => f.name === 'c3' || f.name === 'c4'));

                this.currentQuestionFiles = sortedFiles.map(f => f.path);

                // Log chi tiết
                this.writeLog(`TÌM THẤY ${sortedFiles.length} FILE:`);
                sortedFiles.forEach(file => {
                    this.writeLog(`- ${file.fileName} (${file.path})`);
                });

                // Nếu không tìm thấy file nào, báo lỗi
                if (this.currentQuestionFiles.length === 0) {
                    this.writeLog(`LỖI: Không tìm thấy file nào trong thư mục ${folderName}`);
                    alert(`LỖI: Không tìm thấy file audio trong thư mục ${folderName}!`);
                    this.skipToNextQuestion();
                    return;
                }

                this.currentSubQuestion = 1;
                this.playCurrentSubQuestion();
            }

            // Hàm mới: tìm và thêm file nếu tồn tại
            async findAndAddFile(questionFolder, folderName, fileList, fileType, foundFiles) {
                const found = await this.findFile(questionFolder, folderName, fileList);
                if (found) {
                    foundFiles.push({ 
                        name: fileType, 
                        path: found.path, 
                        fileName: found.fileName 
                    });
                    this.writeLog(`TÌM THẤY ${fileType}: ${found.fileName}`);
                } else {
                    this.writeLog(`KHÔNG TÌM THẤY ${fileType} trong ${fileList.join(', ')}`);
                }
            }

            // Hàm mới: tìm file đầu tiên tồn tại trong danh sách
            async findFile(questionFolder, folderName, fileList) {
                for (const fileName of fileList) {
                    const filePath = this.getAudioPath(questionFolder, folderName, fileName);
                    const fileExists = await this.checkFileExists(filePath);
                    if (fileExists) {
                        return { path: filePath, fileName: fileName };
                    }
                }
                return null;
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

                this.updateStatus(); // 🟢 cập nhật hiển thị khi đổi file
this.updateStatus(); // 🟢 gọi lại để cập nhật tên mỗi lần phát file
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
                        this.writeLog(`LỖI PHÁT AUDIO: ${error.target.error?.message || 'Unknown error'}`);
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
  const lblStatus = document.getElementById('lblStatus');
    const lblCurrentFile = document.getElementById('lblCurrentFile');

    const totalQuestions = this.totalQuestions || 15; // tổng số câu trong bài
    const totalFiles = this.currentQuestionFiles ? this.currentQuestionFiles.length : 0;
    const currentFileName = this.currentQuestionFiles && this.currentQuestionFiles.length >= this.currentSubQuestion
        ? this.getFileNameFromPath(this.currentQuestionFiles[this.currentSubQuestion - 1])
        : "---";

    // 🟢 Hiển thị số câu hỏi tổng hợp (displayQuestionIndex)
    lblStatus.textContent = `Câu hỏi: ${this.displayQuestionIndex}/${totalQuestions} - File: ${this.currentSubQuestion}/${totalFiles}`;
    lblCurrentFile.textContent = currentFileName;
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
