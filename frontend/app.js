// frontend/app.js
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const welcomeState = document.getElementById('welcome-state');
const newChatBtn = document.getElementById('new-chat-btn');

// ตัวแปรควบคุมประวัติการแชท
let conversations = JSON.parse(localStorage.getItem('nexus_chats')) || [];
let currentChatId = null;

// 👉 1. ฟังก์ชันโหลดประวัติการแชทมาแสดงบน Sidebar
function renderSidebar() {
    // หาพื้นที่วางรายการ Recent Chats (อ้างอิงจากคลาสหรือโครงสร้างเดิม)
    const historyContainer = document.querySelector('aside .space-y-2');
    if (!historyContainer) return;

    // ล้างรายการเก่าออกก่อน (เหลือหัวข้อ Recent Chats ไว้)
    historyContainer.innerHTML = '<p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">Recent Chats</p>';

    conversations.forEach(chat => {
        const isActive = chat.id === currentChatId;
        const chatItem = document.createElement('a');
        chatItem.href = '#';
        chatItem.className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border border-transparent ${
            isActive 
            ? 'bg-indigo-600/20 border-indigo-500/30 text-white font-medium' 
            : 'hover:bg-gray-800/40 text-gray-400 hover:text-gray-200'
        }`;
        
        chatItem.innerHTML = `
            <i class="fa-regular fa-message ${isActive ? 'text-indigo-400' : ''} text-xs"></i>
            <span class="truncate flex-1">${chat.title}</span>
        `;

        // กดสลับห้องแชท
        chatItem.addEventListener('click', (e) => {
            e.preventDefault();
            switchChat(chat.id);
        });

        historyContainer.appendChild(chatItem);
    });
}

// 👉 2. ฟังก์ชันสลับห้องแชท และดึงข้อความเก่ามาแสดง
function switchChat(chatId) {
    currentChatId = chatId;
    const currentChat = conversations.find(c => c.id === chatId);
    
    if (!currentChat) return;

    // ซ่อน Welcome State
    if (welcomeState) welcomeState.style.display = 'none';

    // ล้างหน้าจอแชทปัจจุบัน
    const messages = chatContainer.querySelectorAll('div:not(#welcome-state)');
    messages.forEach(msg => msg.remove());

    // วาดข้อความเก่าทั้งหมดในห้องนี้ออกจอ
    currentChat.messages.forEach(msg => {
        appendMessage(msg.sender, msg.text);
    });

    renderSidebar();
}

// 👉 3. ฟังก์ชันเริ่มแชทห้องใหม่ (New Conversation)
function startNewChat() {
    currentChatId = null;
    const messages = chatContainer.querySelectorAll('div:not(#welcome-state)');
    messages.forEach(msg => msg.remove());

    if (welcomeState) {
        welcomeState.style.display = 'block';
    }
    userInput.value = '';
    renderSidebar();
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
}

// 👉 4. ระบบส่งข้อความ (ปรับปรุงให้บันทึกข้อมูลลงฐานข้อมูลเบราว์เซอร์)
chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageText = userInput.value.trim();
    if (!messageText) return;

    if (welcomeState) {
        welcomeState.style.display = 'none';
    }

    // หากเป็นการพิมพ์ประโยคแรกในห้องใหม่ ให้สร้าง ID แชทขึ้นมา
    if (!currentChatId) {
        currentChatId = 'chat_' + Date.now();
        const newChat = {
            id: currentChatId,
            title: messageText.length > 25 ? messageText.substring(0, 25) + '...' : messageText,
            messages: []
        };
        conversations.unshift(newChat); // เอาขึ้นบนสุด
    }

    // บันทึกข้อความผู้ใช้ลงอาร์เรย์
    const currentChat = conversations.find(c => c.id === currentChatId);
    currentChat.messages.push({ sender: 'user', text: messageText });

    // วาดข้อความของผู้ใช้ลงจอ
    appendMessage('user', messageText);
    userInput.value = ''; 
    renderSidebar();
    localStorage.setItem('nexus_chats', JSON.stringify(conversations));

    // แสดงสถานะกำลังประมวลผล
    const loadingMessage = appendLoadingMessage();

    try {
        const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
        });
       
        if (!response.ok) throw new Error('Backend error');

        const data = await response.json();
        loadingMessage.remove();

        // บันทึกคำตอบของ AI ลงอาร์เรย์
        currentChat.messages.push({ sender: 'bot', text: data.reply });
        
        // แสดงคำตอบจริงบนจอ
        appendMessage('bot', data.reply);
        
        // เซฟลงเบราว์เซอร์
        localStorage.setItem('nexus_chats', JSON.stringify(conversations));

    } catch (error) {
        console.error('Error:', error);
        loadingMessage.remove();
        appendMessage('bot', 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
    }
});

// ฟังก์ชันวาดกล่องข้อความบนหน้าจอ (คงเดิมไว้และเพิ่มครอบ Markdown)
function appendMessage(sender, text) {
    const messageWrapper = document.createElement('div');
    if (sender === 'user') {
        messageWrapper.className = 'flex gap-4 max-w-3xl ml-auto justify-end animate-fade-in';
        messageWrapper.innerHTML = `
            <div class="bg-indigo-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-xl shadow-lg leading-relaxed">
                ${text}
            </div>
        `;
    } else {
        const formattedText = typeof marked !== 'undefined' ? marked.parse(text) : text;

        messageWrapper.className = 'flex gap-4 max-w-3xl animate-fade-in';
        messageWrapper.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <i class="fa-solid fa-robot text-white text-xs"></i>
            </div>
            <div class="space-y-2 max-w-xl w-full">
                <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nexus AI</p>
                <div class="bg-[#111827] border border-gray-800/80 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200 leading-relaxed shadow-sm html-content">
                    ${formattedText}
                </div>
            </div>
        `;
    }
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoadingMessage() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex gap-4 max-w-3xl animate-fade-in';
    loadingWrapper.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <i class="fa-solid fa-robot text-white text-xs"></i>
        </div>
        <div class="space-y-2 max-w-xl">
            <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nexus AI</p>
            <div class="bg-[#111827] border border-gray-800/80 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-400 flex items-center gap-2 shadow-sm">
                <i class="fa-solid fa-circle-notch animate-spin text-indigo-400"></i> กำลังประมวลผล...
            </div>
        </div>
    `;
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingWrapper;
}


// โหลดข้อมูลเมื่อเปิดหน้าเว็บครั้งแรก
renderSidebar();