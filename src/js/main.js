// App State
let projects = [];
let currentProjectId = null;
let currentFilter = 'all';

// Status options (Jira-style)
const STATUSES = {
    TODO: 'todo',
    DEVELOP: 'develop',
    DONE: 'done'
};

// SweetAlert2 Configuration
const swalConfig = {
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#64748b',
    background: 'white',
    borderRadius: '16px'
};

// Load data from localStorage
function loadData() {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    } else {
        projects = [];
    }
}

// Save to localStorage
function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    updateSidebar();
    updateMainContent();
    updateTotalStats();
}

// DOM Elements
const projectsList = document.getElementById('projectsList');
const currentProjectName = document.getElementById('currentProjectName');
const projectContent = document.getElementById('projectContent');
const emptyProjectState = document.getElementById('emptyProjectState');
const tasksList = document.getElementById('tasksList');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const projectTaskCount = document.getElementById('projectTaskCount');
const projectCompletedCount = document.getElementById('projectCompletedCount');
const projectProgressBar = document.getElementById('projectProgressBar');
const tasksCount = document.getElementById('tasksCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksCount = document.getElementById('totalTasksCount');
const totalCompletedCount = document.getElementById('totalCompletedCount');

// Modal Elements
const newProjectModal = document.getElementById('newProjectModal');
const editProjectModal = document.getElementById('editProjectModal');
const newProjectName = document.getElementById('newProjectName');
const editProjectName = document.getElementById('editProjectName');

// Buttons
const addProjectBtn = document.getElementById('addProjectBtn');
const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
const editProjectBtn = document.getElementById('editProjectBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');

// Modal close buttons
const closeNewModal = document.getElementById('closeNewModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelNewBtn = document.getElementById('cancelNewBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const createProjectBtn = document.getElementById('createProjectBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

// Initialize app
function init() {
    loadData();
    updateSidebar();
    updateTotalStats();
    
    if (projects.length > 0 && !currentProjectId) {
        currentProjectId = projects[0].id;
    }
    
    updateMainContent();
    setupEventListeners();
    initDragAndDrop();
}

// Initialize Drag & Drop
function initDragAndDrop() {
    // Projects drag & drop
    if (document.getElementById('projectsList')) {
        new Sortable(document.getElementById('projectsList'), {
            animation: 200,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                const newOrder = [];
                const items = document.querySelectorAll('.project-item');
                items.forEach(item => {
                    const projectId = parseInt(item.getAttribute('data-project-id'));
                    const project = projects.find(p => p.id === projectId);
                    if (project) newOrder.push(project);
                });
                projects = newOrder;
                saveData();
                showReorderHint('Project order saved');
            }
        });
    }
    
    // Tasks drag & drop
    if (document.getElementById('tasksList')) {
        new Sortable(document.getElementById('tasksList'), {
            animation: 200,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                if (!currentProjectId) return;
                
                const project = projects.find(p => p.id === currentProjectId);
                if (!project) return;
                
                const newOrder = [];
                const items = document.querySelectorAll('.task-item');
                items.forEach(item => {
                    const taskId = parseInt(item.getAttribute('data-task-id'));
                    const task = project.tasks.find(t => t.id === taskId);
                    if (task) newOrder.push(task);
                });
                project.tasks = newOrder;
                saveData();
                showReorderHint('Task order saved');
            }
        });
    }
}

// Show reorder hint
function showReorderHint(message) {
    const hint = document.createElement('div');
    hint.className = 'reorder-hint';
    hint.innerHTML = `
        <span>✨</span>
        <span>${message}</span>
    `;
    
    const container = currentProjectId ? 
        document.querySelector('.tasks-wrapper') : 
        document.querySelector('.projects-section');
    
    if (container) {
        container.prepend(hint);
        setTimeout(() => {
            hint.style.opacity = '0';
            hint.style.transform = 'translateY(-20px)';
            hint.style.transition = 'all 0.3s';
            setTimeout(() => hint.remove(), 300);
        }, 2000);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add project
    addProjectBtn.addEventListener('click', () => {
        newProjectName.value = '';
        newProjectModal.classList.add('show');
    });
    
    emptyStateCreateBtn.addEventListener('click', () => {
        newProjectName.value = '';
        newProjectModal.classList.add('show');
    });
    
    // Create project
    createProjectBtn.addEventListener('click', createNewProject);
    
    // Edit project
    editProjectBtn.addEventListener('click', () => {
        if (!currentProjectId) return;
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
            editProjectName.value = project.name;
            editProjectModal.classList.add('show');
        }
    });
    
    saveEditBtn.addEventListener('click', () => {
        const newName = editProjectName.value.trim();
        if (newName && currentProjectId) {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                project.name = newName;
                saveData();
                editProjectModal.classList.remove('show');
                
                Swal.fire({
                    title: 'Updated!',
                    text: 'Project name has been changed.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    ...swalConfig
                });
            }
        }
    });
    
    // Delete project with SweetAlert2
    deleteProjectBtn.addEventListener('click', () => {
        if (!currentProjectId) return;
        
        const project = projects.find(p => p.id === currentProjectId);
        
        Swal.fire({
            title: 'Delete Project?',
            html: `<p>Are you sure you want to delete <strong>"${project.name}"</strong>?</p>
                   <p style="color: #ef4444; font-size: 14px;">All tasks will be permanently lost.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            background: 'white',
            backdrop: 'rgba(0,0,0,0.6)'
        }).then((result) => {
            if (result.isConfirmed) {
                projects = projects.filter(p => p.id !== currentProjectId);
                
                if (projects.length > 0) {
                    currentProjectId = projects[0].id;
                } else {
                    currentProjectId = null;
                }
                
                saveData();
                
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Project has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    });
    
    // Close modals
    [closeNewModal, cancelNewBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            newProjectModal.classList.remove('show');
        });
    });
    
    [closeEditModal, cancelEditBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            editProjectModal.classList.remove('show');
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
    
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Clear completed with SweetAlert2
    clearCompletedBtn.addEventListener('click', () => {
        if (!currentProjectId) return;
        
        const project = projects.find(p => p.id === currentProjectId);
        const completedCount = project.tasks.filter(t => t.status === STATUSES.DONE).length;
        
        if (completedCount === 0) {
            Swal.fire({
                title: 'No completed tasks',
                text: 'There are no completed tasks to clear.',
                icon: 'info',
                timer: 1500,
                showConfirmButton: false,
                ...swalConfig
            });
            return;
        }
        
        Swal.fire({
            title: 'Clear completed?',
            text: `This will remove ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Clear',
            cancelButtonText: 'Keep',
            ...swalConfig
        }).then((result) => {
            if (result.isConfirmed) {
                project.tasks = project.tasks.filter(t => t.status !== STATUSES.DONE);
                saveData();
                
                Swal.fire({
                    title: 'Cleared!',
                    text: 'Completed tasks removed.',
                    icon: 'success',
                    timer: 1200,
                    showConfirmButton: false
                });
            }
        });
    });
    
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Enter key in modals
    newProjectName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createNewProject();
        }
    });
    
    editProjectName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEditBtn.click();
        }
    });
}

// Create new project
function createNewProject() {
    const name = newProjectName.value.trim();
    if (name) {
        const newProject = {
            id: Date.now(),
            name: name,
            tasks: []
        };
        
        projects.push(newProject);
        currentProjectId = newProject.id;
        saveData();
        newProjectModal.classList.remove('show');
        
        Swal.fire({
            title: 'Created!',
            text: 'New project has been added.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            ...swalConfig
        });
    } else {
        Swal.fire({
            title: 'Oops...',
            text: 'Please enter a project name',
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            ...swalConfig
        });
    }
}

// Update sidebar
function updateSidebar() {
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                <p style="margin-bottom: 8px;">No projects yet</p>
                <small>Click + to create one</small>
            </div>
        `;
        return;
    }
    
    projectsList.innerHTML = projects.map(project => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === STATUSES.DONE).length;
        
        return `
            <div class="project-item ${currentProjectId === project.id ? 'active' : ''}" 
                 data-project-id="${project.id}"
                 onclick="selectProject(${project.id})">
                <span class="drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                <div class="project-icon">
                    ${project.name.charAt(0).toUpperCase()}
                </div>
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-meta">
                        <span>📋 ${totalTasks}</span>
                        <span>✅ ${completedTasks}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Select project
window.selectProject = function(projectId) {
    currentProjectId = projectId;
    currentFilter = 'all';
    
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    
    updateSidebar();
    updateMainContent();
    
    setTimeout(() => initDragAndDrop(), 100);
};

// Update main content
function updateMainContent() {
    if (!currentProjectId || projects.length === 0) {
        projectContent.style.display = 'none';
        emptyProjectState.style.display = 'block';
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) {
        projectContent.style.display = 'none';
        emptyProjectState.style.display = 'block';
        return;
    }
    
    projectContent.style.display = 'block';
    emptyProjectState.style.display = 'none';
    
    currentProjectName.textContent = project.name;
    
    const total = project.tasks.length;
    const completed = project.tasks.filter(t => t.status === STATUSES.DONE).length;
    
    projectTaskCount.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    projectCompletedCount.textContent = `${completed} completed`;
    
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    projectProgressBar.style.width = `${percentage}%`;
    
    renderTasks();
}

// Render tasks with filter
function renderTasks() {
    if (!currentProjectId) return;
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    let filteredTasks = project.tasks;
    
    if (currentFilter !== 'all') {
        filteredTasks = project.tasks.filter(t => t.status === currentFilter);
    }
    
    tasksCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                <p>No tasks here</p>
                <small>Add a new task to get started</small>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <span class="drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
            <span class="task-content">
                ${task.text}
            </span>
            <div class="task-status">
                <div class="status-badge ${task.status || STATUSES.TODO}" 
                     onclick="event.stopPropagation(); changeTaskStatus(${task.id})">
                    ${(task.status || STATUSES.TODO).charAt(0).toUpperCase() + (task.status || STATUSES.TODO).slice(1)}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" onclick="editTask(${task.id})" title="Edit">✎</button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})" title="Delete">🗑</button>
            </div>
        </div>
    `).join('');
}

// Change task status (cycle through To Do -> Develop -> Done)
window.changeTaskStatus = function(taskId) {
    if (!currentProjectId) return;
    
    const project = projects.find(p => p.id === currentProjectId);
    const task = project.tasks.find(t => t.id === taskId);
    
    // Cycle through statuses
    if (!task.status || task.status === STATUSES.TODO) {
        task.status = STATUSES.DEVELOP;
    } else if (task.status === STATUSES.DEVELOP) {
        task.status = STATUSES.DONE;
    } else if (task.status === STATUSES.DONE) {
        task.status = STATUSES.TODO;
    }
    
    saveData();
};

// Add task
// Add task with Toast notification
function addTask() {
    if (!currentProjectId) {
        Swal.fire({
            title: 'No project selected',
            text: 'Please select a project first',
            icon: 'warning',
            timer: 1500,
            showConfirmButton: false,
            ...swalConfig
        });
        return;
    }
    
    const text = taskInput.value.trim();
    if (!text) {
        Swal.fire({
            title: 'Empty task',
            text: 'Please enter a task description',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            ...swalConfig
        });
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
        const newTask = {
            id: Date.now(),
            text: text,
            status: STATUSES.TODO
        };
        
        project.tasks.push(newTask);
        saveData();
        taskInput.value = '';
        
        // Toast notification (small, non-intrusive)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: 'success',
            title: 'Task added successfully',
            text: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
        });
        
        setTimeout(() => initDragAndDrop(), 100);
    }
}
// Delete task with SweetAlert2
window.deleteTask = function(taskId) {
    if (!currentProjectId) return;
    
    const project = projects.find(p => p.id === currentProjectId);
    const task = project.tasks.find(t => t.id === taskId);
    
    Swal.fire({
        title: 'Delete Task?',
        html: `<p>Are you sure you want to delete:</p>
               <p style="font-weight: 600; color: #1e293b;">"${task.text}"</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        background: 'white'
    }).then((result) => {
        if (result.isConfirmed) {
            project.tasks = project.tasks.filter(t => t.id !== taskId);
            saveData();
            
            Swal.fire({
                title: 'Deleted!',
                text: 'Task has been removed.',
                icon: 'success',
                timer: 1200,
                showConfirmButton: false
            });
        }
    });
};

// Edit task
window.editTask = async function(taskId) {
    if (!currentProjectId) return;
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const { value: newText } = await Swal.fire({
        title: 'Edit Task',
        input: 'text',
        inputLabel: 'Update task description',
        inputValue: task.text,
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value) {
                return 'Task cannot be empty!';
            }
        },
        ...swalConfig
    });
    
    if (newText) {
        task.text = newText.trim();
        saveData();
        
        Swal.fire({
            title: 'Updated!',
            text: 'Task has been edited.',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false
        });
    }
};

// Update total stats
function updateTotalStats() {
    let total = 0;
    let completed = 0;
    
    projects.forEach(project => {
        total += project.tasks.length;
        completed += project.tasks.filter(t => t.status === STATUSES.DONE).length;
    });
    
    totalTasksCount.textContent = total;
    totalCompletedCount.textContent = completed;
}

// Initialize app
init(); 