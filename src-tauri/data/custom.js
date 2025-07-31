// Hanime1.me 增强功能脚本
// 为网站添加各种便利功能

(function() {
    'use strict';
    
    // 配置对象
    const config = {
        downloadDir: localStorage.getItem('hanime_download_dir') || 'Downloads',
        playbackSpeed: 1,
        currentPlaylist: [],
        currentIndex: 0,
        isInPlaylist: false
    };
    
    // 创建设置面板
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'hanime-settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
        `;
        
        panel.innerHTML = `
            <h3 style="margin-top: 0;">设置</h3>
            <div style="margin-bottom: 15px;">
                <label>下载目录:</label><br>
                <div style="margin: 5px 0;">
                    <select id="preset-dir-select" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 5px;">
                        <option value="">选择预设目录...</option>
                        <option value="Downloads">Downloads</option>
                        <option value="Desktop">桌面 (Desktop)</option>
                        <option value="Documents">文档 (Documents)</option>
                        <option value="Videos">视频 (Videos)</option>
                        <option value="D:\\Downloads">D:\\Downloads</option>
                        <option value="E:\\Downloads">E:\\Downloads</option>
                        <option value="C:\\Users\\${navigator.userAgent.includes('Windows') ? '%USERNAME%' : 'user'}\\Downloads">用户下载文件夹</option>
                        <option value="custom">自定义路径...</option>
                    </select>
                </div>
                <div style="margin: 5px 0;">
                    <button id="browse-dir-btn" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;">
                        📁 浏览选择目录
                    </button>
                    <input type="file" id="dir-picker" webkitdirectory directory style="display: none;">
                </div>
                <input type="text" id="download-dir-input" value="${config.downloadDir}" 
                       style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;" 
                       placeholder="输入自定义下载路径...">
                <div style="margin-top: 5px; font-size: 11px; color: #aaa;">
                    💡 提示: 可选择预设目录或输入自定义路径
                </div>
            </div>
            <button id="save-settings" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">保存</button>
            <button id="close-settings" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">关闭</button>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        document.getElementById('preset-dir-select').onchange = (e) => {
            const selectedValue = e.target.value;
            const inputField = document.getElementById('download-dir-input');
            
            if (selectedValue && selectedValue !== 'custom') {
                // 处理Windows环境变量
                let processedPath = selectedValue;
                if (selectedValue.includes('%USERNAME%')) {
                    // 在实际使用时，这个会被浏览器或下载管理器处理
                    processedPath = selectedValue.replace('%USERNAME%', 'User');
                }
                inputField.value = processedPath;
                inputField.style.backgroundColor = '#2a4a2a'; // 绿色提示已选择
                
                // 2秒后恢复原色
                setTimeout(() => {
                    inputField.style.backgroundColor = '#333';
                }, 2000);
            } else if (selectedValue === 'custom') {
                inputField.focus();
                inputField.style.backgroundColor = '#4a4a2a'; // 黄色提示输入自定义
                
                setTimeout(() => {
                    inputField.style.backgroundColor = '#333';
                }, 2000);
            }
        };
        
        // 目录选择器事件
        document.getElementById('browse-dir-btn').onclick = () => {
            document.getElementById('dir-picker').click();
        };
        
        document.getElementById('dir-picker').onchange = (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                // 获取选择的目录路径
                const firstFile = files[0];
                let dirPath = firstFile.webkitRelativePath;
                
                // 提取目录路径（移除文件名部分）
                const pathParts = dirPath.split('/');
                if (pathParts.length > 1) {
                    pathParts.pop(); // 移除文件名
                    dirPath = pathParts.join('\\'); // 使用Windows路径分隔符
                }
                
                // 尝试获取完整路径（如果浏览器支持）
                if (firstFile.path) {
                    const fullPath = firstFile.path;
                    const lastSlash = fullPath.lastIndexOf('\\');
                    if (lastSlash !== -1) {
                        dirPath = fullPath.substring(0, lastSlash);
                    }
                }
                
                const inputField = document.getElementById('download-dir-input');
                inputField.value = dirPath;
                inputField.style.backgroundColor = '#2a4a2a'; // 绿色提示已选择
                
                // 重置预设选择器
                document.getElementById('preset-dir-select').value = '';
                
                // 2秒后恢复原色
                setTimeout(() => {
                    inputField.style.backgroundColor = '#333';
                }, 2000);
                
                console.log('选择的目录:', dirPath);
            }
        };
        
        document.getElementById('save-settings').onclick = () => {
            const newDir = document.getElementById('download-dir-input').value.trim();
            if (!newDir) {
                alert('请输入下载目录路径');
                return;
            }
            
            // 使用downloadManager的方法设置下载路径
            downloadManager.setDownloadPath(newDir);
            
            // 同时更新config以保持兼容性
            config.downloadDir = newDir;
            localStorage.setItem('hanime_download_dir', config.downloadDir);
            
            // 重置选择器
            document.getElementById('preset-dir-select').value = '';
            
            alert(`设置已保存\n下载目录: ${config.downloadDir}`);
        };
        
        document.getElementById('close-settings').onclick = () => {
            panel.style.display = 'none';
            // 重置选择器
            document.getElementById('preset-dir-select').value = '';
        };
    }
    
    // 创建播放列表面板
    function createPlaylistPanel() {
        const panel = document.createElement('div');
        panel.id = 'hanime-playlist-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 350px;
            max-height: 500px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <h3 style="margin-top: 0;">播放列表</h3>
            <div id="playlist-content"></div>
            <button id="clear-playlist" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">清空列表</button>
            <button id="close-playlist" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">关闭</button>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        document.getElementById('clear-playlist').onclick = () => {
            config.currentPlaylist = [];
            updatePlaylistDisplay();
            localStorage.removeItem('hanime_playlist');
        };
        
        document.getElementById('close-playlist').onclick = () => {
            panel.style.display = 'none';
        };
    }
    
    // 创建下载管理面板
    function createDownloadManagerPanel() {
        const panel = document.createElement('div');
        panel.id = 'download-manager-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            max-height: 500px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        `;
        
        panel.innerHTML = `
            <div style="padding: 15px 20px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 16px;">📥 下载管理器</h3>
                <div>
                    <button id="toggle-download-list" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px; font-size: 12px;">收起</button>
                    <button id="close-download-manager" style="background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">关闭</button>
                </div>
            </div>
            <div id="download-list-content" style="max-height: 400px; overflow-y: auto; padding: 15px;"></div>
            <div style="padding: 10px 20px; border-top: 1px solid #444; font-size: 12px; color: #aaa; text-align: center;">
                <span id="download-summary">总计: 0 个任务</span>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        let isCollapsed = false;
        
        // 绑定事件
        document.getElementById('toggle-download-list').onclick = () => {
            const content = document.getElementById('download-list-content');
            const button = document.getElementById('toggle-download-list');
            
            if (isCollapsed) {
                content.style.display = 'block';
                button.textContent = '收起';
                isCollapsed = false;
            } else {
                content.style.display = 'none';
                button.textContent = '展开';
                isCollapsed = true;
            }
        };
        
        document.getElementById('close-download-manager').onclick = () => {
            panel.style.display = 'none';
        };
        
        // 更新下载摘要
        const updateSummary = () => {
            const summary = document.getElementById('download-summary');
            if (summary) {
                const total = downloadManager.downloads.length;
                const completed = downloadManager.downloads.filter(d => d.status === 'completed').length;
                const downloading = downloadManager.downloads.filter(d => d.status === 'downloading').length;
                summary.textContent = `总计: ${total} 个任务 | 已完成: ${completed} | 下载中: ${downloading}`;
            }
        };
        
        // 重写下载管理器的更新方法以包含摘要更新
        const originalUpdate = downloadManager.updateDownloadList;
        downloadManager.updateDownloadList = function() {
            originalUpdate.call(this);
            updateSummary();
        };
    }
    
    // 更新播放列表显示
    function updatePlaylistDisplay() {
        const content = document.getElementById('playlist-content');
        if (!content) return;
        
        if (config.currentPlaylist.length === 0) {
            content.innerHTML = '<p>播放列表为空</p>';
            return;
        }
        
        content.innerHTML = config.currentPlaylist.map((item, index) => `
            <div style="padding: 8px; border-bottom: 1px solid #444; ${index === config.currentIndex ? 'background: #007bff;' : ''}">
                <div style="font-weight: bold;">${item.title}</div>
                <div style="font-size: 12px; color: #ccc;">${item.url}</div>
                <button onclick="playFromPlaylist(${index})" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-top: 5px;">播放</button>
                <button onclick="removeFromPlaylist(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-left: 5px;">删除</button>
            </div>
        `).join('');
    }
    
    // 添加到播放列表
    function addToPlaylist(title, url) {
        const item = { title, url };
        config.currentPlaylist.push(item);
        localStorage.setItem('hanime_playlist', JSON.stringify(config.currentPlaylist));
        updatePlaylistDisplay();
        showNotification('已添加到播放列表');
    }
    
    // 从播放列表播放
    window.playFromPlaylist = function(index) {
        config.currentIndex = index;
        config.isInPlaylist = true;
        window.location.href = config.currentPlaylist[index].url;
    };
    
    // 从播放列表删除
    window.removeFromPlaylist = function(index) {
        config.currentPlaylist.splice(index, 1);
        if (config.currentIndex >= index && config.currentIndex > 0) {
            config.currentIndex--;
        }
        localStorage.setItem('hanime_playlist', JSON.stringify(config.currentPlaylist));
        updatePlaylistDisplay();
    };
    
    // 显示通知
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10001;
            font-family: Arial, sans-serif;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    
    // 下载管理器
    const downloadManager = {
        downloads: [],
        nextId: 1,
        downloadPath: '', // 用户设置的下载路径
        
        // 初始化设置
        init() {
            // 从localStorage加载设置
            this.downloadPath = localStorage.getItem('hanime_download_path') || '';
            
            // 禁用浏览器默认下载行为
            this.disableBrowserDownload();
        },
        
        // 禁用浏览器默认下载
        disableBrowserDownload() {
            // 拦截所有下载链接的点击事件
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a[download], a[href$=".mp4"], a[href$=".mkv"], a[href$=".avi"]');
                if (target && target.href && target.href.includes('hanime')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('已拦截浏览器默认下载:', target.href);
                    return false;
                }
            }, true);
            
            // 拦截右键另存为
            document.addEventListener('contextmenu', (e) => {
                const target = e.target;
                if (target.tagName === 'VIDEO' || target.closest('video')) {
                    // 可以选择是否阻止视频的右键菜单
                    // e.preventDefault();
                }
            });
        },
        
        // 设置下载路径
        setDownloadPath(path) {
            this.downloadPath = path;
            localStorage.setItem('hanime_download_path', path);
            showNotification(`下载路径已设置: ${path}`);
        },
        
        async addDownload(url, filename, quality) {
            const download = {
                id: this.nextId++,
                url,
                filename,
                quality,
                progress: 0,
                speed: 0,
                status: 'validating', // validating, downloading, completed, error, paused
                startTime: Date.now()
            };
            this.downloads.push(download);
            
            // 如果需要验证URL，先进行验证
            if (quality !== 'current') {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    if (!response.ok) {
                        throw new Error(`URL无效: ${response.status} ${response.statusText}`);
                    }
                    download.status = 'downloading';
                } catch (error) {
                    download.status = 'error';
                    download.error = `URL验证失败: ${error.message}`;
                    this.updateDownloadList();
                    showNotification(`下载失败: ${download.filename} - ${error.message}`, 'error');
                    return;
                }
            } else {
                download.status = 'downloading';
            }
            this.updateDownloadList();
            this.startDownload(download);
            return download.id;
        },
        
        async startDownload(download) {
            try {
                // 使用fetch API进行真实下载
                const response = await fetch(download.url);
                
                if (!response.ok) {
                    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
                }
                
                const contentLength = response.headers.get('content-length');
                const total = parseInt(contentLength, 10);
                let loaded = download.loaded || 0;
                
                // 创建可读流来跟踪下载进度
                const reader = response.body.getReader();
                const chunks = download.chunks || [];
                
                download.status = 'downloading';
                download.reader = reader; // 保存reader引用用于暂停
                const startTime = Date.now();
                
                try {
                    while (true) {
                        // 检查是否被暂停
                        if (download.status === 'paused') {
                            download.loaded = loaded;
                            download.chunks = chunks;
                            return;
                        }
                        
                        const { done, value } = await reader.read();
                        
                        if (done) break;
                        
                        chunks.push(value);
                        loaded += value.length;
                        
                        // 计算真实进度和速度
                        if (total > 0) {
                            download.progress = (loaded / total) * 100;
                        }
                        
                        const elapsed = (Date.now() - startTime) / 1000;
                        download.speed = elapsed > 0 ? (loaded / 1024 / 1024) / elapsed : 0;
                        
                        this.updateDownloadList();
                        
                        // 添加小延迟以允许UI更新和暂停检查
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                } catch (readerError) {
                    if (download.status === 'paused') {
                        return; // 正常暂停，不是错误
                    }
                    throw readerError;
                }
                
                // 合并所有数据块
                const blob = new Blob(chunks);
                
                // 尝试使用Chrome下载API（如果可用）
                if (typeof chrome !== 'undefined' && chrome.downloads) {
                    try {
                        const url = URL.createObjectURL(blob);
                        const downloadOptions = {
                            url: url,
                            filename: download.filename,
                            saveAs: false
                        };
                        
                        // 如果设置了下载路径，添加到文件名中
                        if (this.downloadPath) {
                            downloadOptions.filename = this.downloadPath.replace(/[\\/]+$/, '') + '\\' + download.filename;
                        }
                        
                        chrome.downloads.download(downloadOptions, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.log('Chrome API下载失败，使用备用方法:', chrome.runtime.lastError.message);
                                this.fallbackDownload(blob, download.filename);
                            } else {
                                console.log('Chrome API下载成功，ID:', downloadId, '路径:', downloadOptions.filename);
                            }
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                        });
                    } catch (error) {
                        console.log('Chrome API不可用，使用备用方法:', error.message);
                        this.fallbackDownload(blob, download.filename);
                    }
                } else {
                    // 备用下载方法
                    this.fallbackDownload(blob, download.filename);
                }
                
                download.progress = 100;
                download.status = 'completed';
                delete download.reader;
                delete download.loaded;
                delete download.chunks;
                this.updateDownloadList();
                
                showNotification(`下载完成: ${download.filename}`);
                
            } catch (error) {
                console.error('下载错误:', error);
                download.status = 'error';
                download.error = error.message;
                delete download.reader;
                this.updateDownloadList();
                showNotification(`下载失败: ${error.message}`, 'error');
            }
        },
        
        fallbackDownload(blob, filename) {
            // 备用下载方法：创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        
        // 暂停下载
        pauseDownload(id) {
            const download = this.downloads.find(d => d.id === id);
            if (download && download.status === 'downloading') {
                download.status = 'paused';
                // 如果有reader，尝试取消它
                if (download.reader) {
                    try {
                        download.reader.cancel();
                    } catch (e) {
                        console.log('Reader cancel failed:', e);
                    }
                }
                this.updateDownloadList();
                showNotification(`下载已暂停: ${download.filename}`);
            }
        },
        
        // 恢复下载
        resumeDownload(id) {
            const download = this.downloads.find(d => d.id === id);
            if (download && download.status === 'paused') {
                showNotification(`恢复下载: ${download.filename}`);
                this.startDownload(download);
            }
        },
        
        removeDownload(id) {
            this.downloads = this.downloads.filter(d => d.id !== id);
            this.updateDownloadList();
        },
        
        updateDownloadList() {
            const container = document.getElementById('download-list-content');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (this.downloads.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">暂无下载任务</div>';
                return;
            }
            
            this.downloads.forEach(download => {
                const item = document.createElement('div');
                item.style.cssText = `
                    background: #333;
                    margin-bottom: 10px;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid ${download.status === 'completed' ? '#28a745' : download.status === 'error' ? '#dc3545' : '#007bff'};
                `;
                
                const statusText = {
                    'validating': '验证中',
                    'downloading': '下载中',
                    'completed': '已完成',
                    'error': '下载失败',
                    'paused': '已暂停'
                }[download.status];
                
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-weight: bold; color: white; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${download.filename}</div>
                        <div>
                            <button class="pause-btn" data-id="${download.id}" style="background: #ffc107; color: #000; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 5px; display: ${download.status === 'downloading' ? 'inline-block' : 'none'};">暂停</button>
                            <button class="resume-btn" data-id="${download.id}" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 5px; display: ${download.status === 'paused' ? 'inline-block' : 'none'};">恢复</button>
                            <button class="delete-btn" data-id="${download.id}" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">删除</button>
                        </div>
                    </div>
                    <div style="color: #ccc; font-size: 12px; margin-bottom: 5px;">${download.quality} | ${statusText}</div>
                    ${download.error ? `<div style="color: #dc3545; font-size: 11px; margin-bottom: 5px;">错误: ${download.error}</div>` : ''}
                    <div style="background: #555; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 5px;">
                        <div style="background: ${download.status === 'completed' ? '#28a745' : download.status === 'error' ? '#dc3545' : '#007bff'}; height: 100%; width: ${download.progress}%; transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #aaa;">
                        <span>${Math.round(download.progress)}%</span>
                        <span>${download.status === 'downloading' ? download.speed.toFixed(1) + ' MB/s' : ''}</span>
                    </div>
                `;
                
                // 添加事件监听器
                const pauseBtn = item.querySelector('.pause-btn');
                const resumeBtn = item.querySelector('.resume-btn');
                const deleteBtn = item.querySelector('.delete-btn');
                
                if (pauseBtn) {
                    pauseBtn.addEventListener('click', () => this.pauseDownload(download.id));
                }
                if (resumeBtn) {
                    resumeBtn.addEventListener('click', () => this.resumeDownload(download.id));
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.removeDownload(download.id));
                }
                
                container.appendChild(item);
            });
        }
    };
    
    // 移除了复杂的视频质量抓取功能，现在直接使用当前播放的视频
    
    // 获取视频标题
    function getVideoTitle() {
        // 尝试多种选择器来获取视频标题
        const titleSelectors = [
            'h1.video-title',
            '.video-title',
            'h1[class*="title"]',
            '.title',
            'h1',
            'h2',
            '[data-title]'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                let title = element.textContent.trim();
                // 清理标题，移除多余的空白和特殊字符
                title = title.replace(/\s+/g, ' ').trim();
                // 如果标题不是页面标题且长度合理，则使用它
                if (title !== document.title && title.length > 3 && title.length < 200) {
                    return title;
                }
            }
        }
        
        // 如果没有找到合适的视频标题，尝试从页面标题中提取
        let pageTitle = document.title;
        // 移除常见的网站后缀
        pageTitle = pageTitle.replace(/\s*-\s*Hanime1\.me.*$/i, '');
        pageTitle = pageTitle.replace(/\s*\|\s*Hanime.*$/i, '');
        pageTitle = pageTitle.trim();
        
        return pageTitle || 'video';
    }
    
    // 移除了复杂的质量选择器，现在直接下载当前播放的视频
    
    // 主下载函数
    async function downloadVideo() {
        const video = document.querySelector('video');
        if (!video) {
            alert('未找到视频元素');
            return;
        }
        
        const videoSrc = video.src || video.currentSrc;
        if (!videoSrc) {
            alert('无法获取视频链接');
            return;
        }
        
        // 直接下载当前播放的视频
        const videoTitle = getVideoTitle();
        const filename = `${videoTitle}.mp4`;
        
        showNotification('开始下载当前视频...', 'info');
        downloadManager.addDownload(videoSrc, filename);
        
        // 显示下载管理器
        const panel = document.getElementById('download-manager-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    }
    
    // 移除了视频预览功能，专注于点击跳转
    
    // 添加视频封面点击跳转功能
function addVideoThumbnailClick() {
        // 只处理视频相关的图片，避免影响其他功能
        const videoImages = document.querySelectorAll(
            'img[src*="thumb"], img[src*="cover"], img[src*="preview"], ' +
            '.video-thumbnail img, .video-item img, .video-card img, ' +
            '[class*="video"] img, [data-video-id] img'
        );
        
        videoImages.forEach(img => {
            // 检查是否已经处理过
            if (img.dataset.clickHandlerAdded) return;
            
            // 查找最近的包含视频链接的父元素
            let parentLink = img.closest('a[href*="/watch/"], a[href*="/video/"]');
            
            if (parentLink && parentLink.href) {
                // 如果图片已经在链接内，只添加视觉效果，不干扰原有点击
                if (!img.style.cursor) {
                    img.style.cursor = 'pointer';
                }
                img.style.transition = 'all 0.2s ease';
                
                // 添加轻微的悬停效果，不影响原有功能
                img.addEventListener('mouseenter', () => {
                    if (!img.dataset.hoverActive) {
                        img.style.opacity = '0.9';
                        img.dataset.hoverActive = 'true';
                    }
                });
                
                img.addEventListener('mouseleave', () => {
                    img.style.opacity = '1';
                    img.dataset.hoverActive = 'false';
                });
                
                img.dataset.clickHandlerAdded = 'true';
                console.log('已为链接内图片添加悬停效果:', parentLink.href);
            } else {
                // 只为确实没有链接的视频图片添加点击功能
                const videoContainer = img.closest('[class*="video"], [id*="video"], [data-video]');
                if (videoContainer && !videoContainer.querySelector('a[href*="/watch/"], a[href*="/video/"]')) {
                    const videoId = extractVideoIdFromThumbnail(img);
                    if (videoId) {
                        img.style.cursor = 'pointer';
                        img.style.transition = 'all 0.2s ease';
                        
                        // 使用更安全的事件处理，避免冲突
                        const clickHandler = (e) => {
                            // 确保不是在其他交互元素上点击
                            if (e.target === img && !e.defaultPrevented) {
                                e.preventDefault();
                                e.stopPropagation();
                                const videoUrl = `${window.location.origin}/watch/${videoId}`;
                                console.log('跳转到视频页面:', videoUrl);
                                window.location.href = videoUrl;
                            }
                        };
                        
                        img.addEventListener('click', clickHandler, { passive: false });
                        
                        // 添加悬停效果
                        img.addEventListener('mouseenter', () => {
                            if (!img.dataset.hoverActive) {
                                img.style.opacity = '0.9';
                                img.dataset.hoverActive = 'true';
                            }
                        });
                        
                        img.addEventListener('mouseleave', () => {
                            img.style.opacity = '1';
                            img.dataset.hoverActive = 'false';
                        });
                        
                        img.dataset.clickHandlerAdded = 'true';
                        console.log('已为无链接图片添加点击功能:', videoUrl);
                    }
                }
            }
        });
        
        // 谨慎处理视频卡片容器的点击，避免干扰原有功能
        const videoCardSelectors = [
            '.video-item:not([data-click-handled])',
            '.video-card:not([data-click-handled])',
            '.video-thumbnail:not([data-click-handled])'
        ];
        
        videoCardSelectors.forEach(selector => {
            const cards = document.querySelectorAll(selector);
            cards.forEach(card => {
                if (card.dataset.clickHandlerAdded) return;
                
                // 查找卡片内的链接
                const link = card.querySelector('a[href*="/watch/"], a[href*="/video/"]');
                if (link && link.href) {
                    // 检查是否已有点击处理器
                    const hasExistingHandlers = card.onclick || 
                        card.getAttribute('onclick') || 
                        card.dataset.clickHandled;
                    
                    if (!hasExistingHandlers) {
                        // 只在安全的情况下添加点击处理
                        const clickHandler = (e) => {
                            // 更严格的检查，避免干扰其他交互
                            if (e.target === card || 
                                (!e.target.closest('a, button, input, select, textarea') && 
                                 !e.target.onclick && 
                                 !e.target.getAttribute('onclick'))) {
                                e.preventDefault();
                                console.log('卡片点击跳转:', link.href);
                                window.location.href = link.href;
                            }
                        };
                        
                        card.addEventListener('click', clickHandler, { passive: false });
                        card.style.cursor = 'pointer';
                    }
                    
                    card.dataset.clickHandlerAdded = 'true';
                }
            });
        });
    }
    
    // 从缩略图中提取视频ID
    function extractVideoIdFromThumbnail(thumbnail) {
        // 尝试从src属性中提取
        const src = thumbnail.src || thumbnail.dataset.src || thumbnail.dataset.original;
        if (src) {
            // 匹配常见的视频ID模式
            const patterns = [
                /\/([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp)/,
                /thumb\/([a-zA-Z0-9_-]+)/,
                /cover\/([a-zA-Z0-9_-]+)/,
                /preview\/([a-zA-Z0-9_-]+)/,
                /([a-zA-Z0-9_-]{8,})/
            ];
            
            for (const pattern of patterns) {
                const match = src.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        
        // 尝试从data属性中提取
        const dataId = thumbnail.dataset.videoId || thumbnail.dataset.id;
        if (dataId) {
            return dataId;
        }
        
        // 尝试从父元素的属性中提取
        const parent = thumbnail.closest('[data-video-id], [data-id]');
        if (parent) {
            return parent.dataset.videoId || parent.dataset.id;
        }
        
        return null;
    }
    
    // 屏蔽广告
    function blockAds() {
        const adSelectors = [
            '.ad', '.ads', '.advertisement', '.banner',
            '[class*="ad-"]', '[id*="ad-"]',
            'iframe[src*="ads"]', 'iframe[src*="doubleclick"]',
            '.popup', '.overlay', '.modal',
            
            // 用户指定的广告选择器
            '#content-div > div.row.no-gutter.video-show-width > div.col-md-3.single-show-list > div:nth-child(1)',
            
            // 相似特征的广告选择器
            '#content-div .col-md-3.single-show-list > div:first-child',
            '.col-md-3.single-show-list > div:nth-child(1)',
            '.single-show-list > div:first-child',
            '[class*="single-show-list"] > div:first-child',
            
            // 基于实际网站结构的广告选择器
            // Exoclick 广告
            'div[id*="exoclick"]',
            'div[class*="exoclick"]',
            'script[src*="exoclick"]',
            
            // JuicyAds 广告（基于实际网站分析）
            'div[id*="juicyads"]',
            'div[class*="juicyads"]',
            'script[src*="juicyads"]',
            'a[href*="juicyads.com"]',
            'a[href*="ck.juicyads.com"]',
            'a[href*="ux13.juicyads.com"]',
            'img[src*="ads.juicyads.me"]',
            'img[src*="juicyads"]',
            'table:has(a[href*="juicyads"])',
            'td:has(a[href*="juicyads"])',
            'tr:has(a[href*="juicyads"])',
            
            // Google Ads
            'div[id*="google_ads"]',
            'div[class*="google-ads"]',
            'script[src*="googlesyndication"]',
            'iframe[src*="googlesyndication"]',
            
            // 弹窗广告相关
            '.stripchat-popunder',
            '.home-card-popunder',
            'a[class*="popunder"]',
            'div[class*="popunder"]',
            
            // 高z-index元素（通常是广告）
            'div[style*="z-index: 9999"]',
            'div[style*="z-index: 99999"]',
            'div[style*="z-index: 999999"]',
            'div[style*="z-index: 10000"]',
            
            // 固定定位的可疑元素
            'div[style*="position: fixed"][style*="width: 100%"][style*="height: 100%"]',
            'div[style*="position: fixed"][style*="top: 0"][style*="left: 0"]',
            'div[style*="position: fixed"][style*="bottom: 0"]',
            
            // 广告脚本和iframe
            'iframe[src*="exoclick"]',
            'iframe[src*="juicyads"]',
            'script[src*="ads"]',
            'script[src*="advertising"]',
            'script[data-cfasync="false"]',
            
            // 外部广告链接（基于实际网站分析）
            'a[href*="l.labsda.com"]',
            'a[href*="l.erodatalabs.com"]',
            'a[href*="l.sqzkm.com"]',
            'img[src*="erolabs"]',
            
            // 包含广告文本的元素
            '*:contains("點點廣告，贊助我們")',
            '*:contains("Ads by JuicyAds")',
            '*:contains("Advertisement")',
            
            // 表格形式的广告
            'table[style*="width"][style*="height"]:has(a[href*="ads"])',
            'table:has(img[src*="ads"])',
            'table:has(a[href*="juicyads"])',
            'table:has(a[href*="exoclick"])'
        ];
        
        let blockedCount = 0;
        
        // 注入CSS样式来隐藏广告
        const style = document.createElement('style');
        style.textContent = `
            /* 隐藏JuicyAds广告 */
            a[href*="juicyads.com"],
            a[href*="ck.juicyads.com"],
            a[href*="ux13.juicyads.com"],
            img[src*="ads.juicyads.me"],
            table:has(a[href*="juicyads"]),
            /* 隐藏外部广告链接 */
            a[href*="l.labsda.com"],
            a[href*="l.erodatalabs.com"],
            a[href*="l.sqzkm.com"],
            /* 隐藏广告脚本 */
            script[src*="juicyads"],
            script[src*="exoclick"],
            iframe[src*="juicyads"],
            iframe[src*="exoclick"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                z-index: -1 !important;
            }
        `;
        document.head.appendChild(style);
        
        // 拦截广告元素
        adSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && !el.hasAttribute('data-blocked')) {
                        // 多重隐藏确保广告被完全屏蔽
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('opacity', '0', 'important');
                        el.style.setProperty('height', '0', 'important');
                        el.style.setProperty('width', '0', 'important');
                        el.style.setProperty('overflow', 'hidden', 'important');
                        el.style.setProperty('position', 'absolute', 'important');
                        el.style.setProperty('left', '-9999px', 'important');
                        el.style.setProperty('top', '-9999px', 'important');
                        el.style.setProperty('z-index', '-1', 'important');
                        
                        // 移除事件监听器
                        if (el.onclick) el.onclick = null;
                        if (el.onmousedown) el.onmousedown = null;
                        if (el.onmouseup) el.onmouseup = null;
                        if (el.addEventListener) {
                            el.removeEventListener('click', function() {});
                            el.removeEventListener('mousedown', function() {});
                        }
                        
                        // 移除元素
                        try {
                            if (el.parentNode) {
                                el.parentNode.removeChild(el);
                            }
                        } catch (e) {
                            // 如果无法移除，至少隐藏
                            el.style.setProperty('display', 'none', 'important');
                        }
                        
                        // 标记为已拦截
                        el.setAttribute('data-blocked', 'true');
                        
                        blockedCount++;
                        console.log('已拦截广告元素:', selector, el);
                    }
                });
            } catch (e) {
                console.log('选择器错误:', selector, e.message);
            }
        });
        
        // 拦截弹窗事件
        const originalOpen = window.open;
        window.open = function(url, name, specs) {
            console.log('拦截弹窗:', url);
            return null;
        };
        
        // 拦截广告相关的点击事件
        document.addEventListener('click', function(e) {
            const target = e.target;
            if (target && (
                target.classList.contains('stripchat-popunder') ||
                target.classList.contains('home-card-popunder') ||
                target.className.includes('popunder') ||
                target.href && (target.href.includes('exoclick') || target.href.includes('juicyads'))
            )) {
                e.preventDefault();
                e.stopPropagation();
                console.log('拦截广告点击:', target);
                return false;
            }
        }, true);
        
        if (blockedCount > 0) {
            console.log(`本次拦截了 ${blockedCount} 个广告元素`);
        }
        
        // 使用MutationObserver监控DOM变化
        if (!window.adBlockObserver) {
            window.adBlockObserver = new MutationObserver(function(mutations) {
                let hasNewAds = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                                // 检查新添加的节点是否是广告
                                adSelectors.forEach(selector => {
                                    try {
                                        if (node.matches && node.matches(selector)) {
                                            hasNewAds = true;
                                        }
                                        // 检查子元素
                                        const childAds = node.querySelectorAll && node.querySelectorAll(selector);
                                        if (childAds && childAds.length > 0) {
                                            hasNewAds = true;
                                        }
                                    } catch (e) {
                                        // 忽略选择器错误
                                    }
                                });
                            }
                        });
                    }
                });
                
                if (hasNewAds) {
                    console.log('检测到新的广告元素，重新运行拦截');
                    setTimeout(blockAds, 100);
                }
            });
            
            // 开始观察
            window.adBlockObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        // 设置定时器持续监控新的广告
        setTimeout(() => {
            blockAds();
        }, 3000);
        
        // 页面加载完成后再次检查
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(blockAds, 1000);
            });
        }
        
        // 窗口加载完成后再次检查
        window.addEventListener('load', () => {
            setTimeout(blockAds, 2000);
        });
    }
    
    // 键盘快捷键处理
    function handleKeyboardShortcuts(e) {
        // Alt+左箭头 后退
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            window.history.back();
        }
        
        // Alt+右箭头 前进
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            window.history.forward();
        }
        
        // F5 刷新
        if (e.key === 'F5') {
            // 不阻止默认行为，让浏览器正常刷新
            return;
        }
        
        // Ctrl+D 下载
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            downloadVideo().catch(console.error);
        }
        
        // Ctrl+S 设置
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const panel = document.getElementById('hanime-settings-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Ctrl+P 播放列表
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            const panel = document.getElementById('hanime-playlist-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Ctrl+M 下载管理器
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            const panel = document.getElementById('download-manager-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Ctrl+H 主页
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/';
        }
        
        // Home 页面顶部
        if (e.key === 'Home') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // End 页面底部
        if (e.key === 'End') {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
        
        // 空格键 播放/暂停
        if (e.key === ' ') {
            const video = document.querySelector('video');
            if (video) {
                e.preventDefault();
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            }
        }
    }
    
    // 长按右箭头倍速播放
    let speedBoostTimeout;
    function handleSpeedBoost() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' && !speedBoostTimeout) {
                speedBoostTimeout = setTimeout(() => {
                    const video = document.querySelector('video');
                    if (video) {
                        video.playbackRate = 2;
                        showNotification('倍速播放中');
                    }
                }, 500); // 长按500ms后触发
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowRight') {
                if (speedBoostTimeout) {
                    clearTimeout(speedBoostTimeout);
                    speedBoostTimeout = null;
                }
                const video = document.querySelector('video');
                if (video && video.playbackRate !== 1) {
                    video.playbackRate = 1;
                    showNotification('恢复正常播放');
                }
            }
        });
    }
    
    // 视频播放完成处理
    function handleVideoEnd() {
        const video = document.querySelector('video');
        if (!video) return;
        
        video.addEventListener('ended', () => {
            if (config.isInPlaylist && config.currentPlaylist.length > 0) {
                // 播放列表中的下一个视频
                config.currentIndex = (config.currentIndex + 1) % config.currentPlaylist.length;
                window.location.href = config.currentPlaylist[config.currentIndex].url;
            } else {
                // 重复播放当前视频
                video.currentTime = 0;
                video.play();
                showNotification('重复播放当前视频');
            }
        });
    }
    
    // 创建浮动控制按钮
    function createFloatingControls() {
        const controls = document.createElement('div');
        controls.id = 'hanime-floating-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: row;
            gap: 2px;
            background: #f1f3f4;
            border-radius: 25px;
            padding: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid #dadce0;
        `;
        
        const buttons = [
            { text: '←', title: '后退 (Alt+←)', action: () => window.history.back() },
            { text: '→', title: '前进 (Alt+→)', action: () => window.history.forward() },
            { text: '↻', title: '刷新 (F5)', action: () => window.location.reload() },
            { text: '🏠', title: '主页 (Ctrl+H)', action: () => window.location.href = '/' },
            { text: '⚙️', title: '设置 (Ctrl+S)', action: () => {
                const panel = document.getElementById('hanime-settings-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }},
            { text: '📋', title: '播放列表 (Ctrl+P)', action: () => {
                const panel = document.getElementById('hanime-playlist-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }},
            { text: '📥', title: '下载管理器 (Ctrl+M)', action: () => {
                const panel = document.getElementById('download-manager-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }},
            { text: '⬇️', title: '下载视频 (Ctrl+D)', action: () => downloadVideo().catch(console.error) },
            { text: '➕', title: '添加到播放列表', action: () => {
                const videoTitle = getVideoTitle();
                addToPlaylist(videoTitle, window.location.href);
            }}
        ];
        
        buttons.forEach((btn, index) => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.title = btn.title;
            button.style.cssText = `
                min-width: 36px;
                height: 36px;
                border: none;
                border-radius: 18px;
                background: transparent;
                color: #5f6368;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                padding: 0 8px;
                position: relative;
            `;
            
            // 添加分隔线
            if (index === 3 || index === 6) {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    width: 1px;
                    height: 20px;
                    background: #dadce0;
                    margin: 0 4px;
                `;
                controls.appendChild(separator);
            }
            
            button.onmouseover = () => {
                button.style.background = '#e8eaed';
                button.style.color = '#202124';
            };
            
            button.onmouseout = () => {
                button.style.background = 'transparent';
                button.style.color = '#5f6368';
            };
            
            button.onmousedown = () => {
                button.style.background = '#dadce0';
            };
            
            button.onmouseup = () => {
                button.style.background = '#e8eaed';
            };
            
            button.onclick = btn.action;
            controls.appendChild(button);
        });
        
        // 添加页面顶部和底部按钮（保持在右侧）
        const verticalControls = document.createElement('div');
        verticalControls.id = 'hanime-vertical-controls';
        verticalControls.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        const verticalButtons = [
            { text: '⬆️', title: '回到顶部 (Home)', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { text: '⬇️', title: '滚动到底部 (End)', action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }
        ];
        
        verticalButtons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.title = btn.title;
            button.style.cssText = `
                width: 45px;
                height: 45px;
                border: none;
                border-radius: 50%;
                background: #f1f3f4;
                color: #5f6368;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
                border: 1px solid #dadce0;
            `;
            
            button.onmouseover = () => {
                button.style.background = '#e8eaed';
                button.style.color = '#202124';
                button.style.transform = 'scale(1.05)';
            };
            
            button.onmouseout = () => {
                button.style.background = '#f1f3f4';
                button.style.color = '#5f6368';
                button.style.transform = 'scale(1)';
            };
            
            button.onclick = btn.action;
            verticalControls.appendChild(button);
        });
        
        document.body.appendChild(controls);
        document.body.appendChild(verticalControls);
    }
    
    // 初始化
    function init() {
        // 初始化下载管理器
        downloadManager.init();
        
        // 加载保存的播放列表
        const savedPlaylist = localStorage.getItem('hanime_playlist');
        if (savedPlaylist) {
            config.currentPlaylist = JSON.parse(savedPlaylist);
        }
        
        // 检查当前页面是否在播放列表中
        const currentUrl = window.location.href;
        const currentIndex = config.currentPlaylist.findIndex(item => item.url === currentUrl);
        if (currentIndex !== -1) {
            config.currentIndex = currentIndex;
            config.isInPlaylist = true;
        }
        
        // 创建UI组件
        createSettingsPanel();
        createPlaylistPanel();
        createDownloadManagerPanel();
        createFloatingControls();
        
        // 绑定事件
        document.addEventListener('keydown', handleKeyboardShortcuts);
        handleSpeedBoost();
        
        // 等待页面加载完成后执行
        setTimeout(() => {
            addVideoThumbnailClick();
            handleVideoEnd();
            blockAds();
            
            // 定期清理广告和重新绑定点击事件（降低频率，减少性能影响）
            setInterval(() => {
                blockAds();
                // 只在检测到新内容时才重新绑定
                const newImages = document.querySelectorAll('img:not([data-click-handler-added])');
                if (newImages.length > 0) {
                    addVideoThumbnailClick();
                }
            }, 8000); // 增加到8秒，减少性能影响
        }, 2000);
        
        updatePlaylistDisplay();
        
        console.log('Hanime1.me 增强功能已加载');
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();