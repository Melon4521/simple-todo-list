const completedTasksRoot = document.querySelector(
  '#completed-tasks .tasks__items',
);
const activeTasksRoot = document.querySelector('#active-tasks .tasks__items');
const editingModal = document.querySelector('#editing-modal');
const editButtonMediaQuery = window.matchMedia('(max-width: 550px)');
let modalActiveElement = null;
let lastActiveEditButton = null;

renderTasks();

document.addEventListener('click', function (event) {
  const target = event.target;

  // Adding new task
  if (target.closest('.add-task')) {
    addNewTask();
  }

  // Deleting task
  if (target.closest('.task-delete')) {
    if (
      confirm(
        'Вы действительно хотите удалить дело без возможности восстановления?',
      )
    ) {
      const taskId = target.closest('.task-delete').dataset.id;
      const json = getLocalStorageData('tasks');
      const newJson = deleteTask(json, taskId);
      setLocalStorageData('tasks', newJson);

      const task = document.querySelector(`.task[data-id="${taskId}"]`);

      if (task) {
        task.remove();
      }

      if (editingModal.classList.contains('_open')) {
        closeEditingModal();
      }
    }
  }

  // Closing editing modal
  if (
    editingModal.classList.contains('_open') &&
    (target.closest('.modal__close') || !target.closest('.modal__body'))
  )
    closeEditingModal();

  // Editing task
  if (target.closest('.task-edit')) {
    const taskId = target.closest('.task-edit').dataset.id;
    const json = getLocalStorageData('tasks');
    const taskJson = json.find(item => +item.id === +taskId);

    if (taskJson) {
      openEditingModal(taskJson);
    }
  }

  // Editing task by clicking on '.task__text'
  if (target.closest('.task button.task__text')) {
    const json = getLocalStorageData('tasks');
    const task = target.closest('.task');
    const taskJson = json.find(item => +item.id === +task.dataset.id);

    if (editButtonMediaQuery.matches) {
      openEditingModal(taskJson);
    } else {
      const editInput = document.createElement('input');

      editInput.type = 'text';
      editInput.placeholder = 'Название...';
      editInput.name = 'edit task description';
      editInput.className = 'task-text';
      editInput.value = taskJson.text;

      target.closest('.task button.task__text').replaceWith(editInput);
      editInput.focus();

      editInput.onblur = editInput.onkeydown = function (event) {
        if (
          (event.type === 'keydown' && event.code === 'Enter') ||
          event.type === 'blur'
        ) {
          editInput.onblur = editInput.onkeydown = null;

          if (editInput.value.trim() !== taskJson.text) {
            taskJson.text = editInput.value.trim() || 'Без названия';
            setLocalStorageData('tasks', json);
          }

          renderTasks();
        }
      };
    }
  }

  // Adding new step
  if (target.closest('.steps__new')) {
    const json = getLocalStorageData('tasks');
    const taskId = target.closest('.steps__new').dataset.id;
    const taskJson = json.find(item => +item.id === +taskId);

    if (taskJson) {
      const stepsItems = target.closest('.steps__new').previousElementSibling;

      let stepId = 1;

      if (taskJson.steps.length) {
        taskJson.steps.forEach(step => {
          if (step.id > stepId) {
            stepId = step.id;
          }
        });

        stepId++;
      }

      stepsItems.insertAdjacentHTML(
        'beforeend',
        /* html */ `
          <div class="steps__item step" data-id="${stepId}">
            <div class="step__checkbox">
              <input 
                id="step-${stepId}"
                class="custom-checkbox"
                type="checkbox"
              >
              <label for="step-${stepId}">
                <span></span>
              </label>
            </div>
            <div class="step__content">
              <input class="step__text task-text" placeholder="Название..." type="text">
              <button name="delete step" class="step__delete button _icon-delete" type="button"></button>
            </div>
          </div>
        `,
      );

      const newStep = stepsItems.lastElementChild;
      const newStepInput = newStep.querySelector('.step__text');

      newStepInput.focus();

      newStepInput.onblur = newStepInput.onkeydown = function (event) {
        if (
          (event.type === 'keydown' && event.code === 'Enter') ||
          event.type === 'blur'
        ) {
          newStepInput.onblur = newStepInput.onkeydown = null;

          taskJson.steps.push({
            id: stepId,
            text: newStepInput.value.trim() || 'Без названия',
            completed: false,
          });

          newStepInput.value = newStepInput.value.trim() || 'Без названия';
          setLocalStorageData('tasks', json);
        }
      };
    }
  }

  // Deleting step
  if (target.closest('.step__delete')) {
    const json = getLocalStorageData('tasks');
    const stepsItems = target.closest('.steps__items');
    const step = target.closest('.step');
    const stepsJson = json.find(
      item => +item.id === +stepsItems.dataset.id,
    ).steps;
    const delIndex = stepsJson.findIndex(item => +item.id === +step.dataset.id);

    if (delIndex !== -1) {
      stepsJson.splice(delIndex, 1);
      setLocalStorageData('tasks', json);
      step.remove();

      if (!stepsItems.children.length) {
        stepsItems.innerHTML = '';
      }
    }
  }
});

document.addEventListener('change', function (event) {
  const target = event.target;

  // Task Checkbox
  if (target.closest('.check-task')) {
    const json = getLocalStorageData('tasks');

    json.find(item => +item.id === +target.dataset.id).completed =
      target.checked;

    if (target.closest('.modal__task')) {
      target
        .closest('.modal__task')
        .querySelector('#modal-text')
        .classList.toggle('_completed');
    }

    setLocalStorageData('tasks', json);
    renderTasks();
  }

  // Editing task text
  if (target.id === 'modal-text') {
    const json = getLocalStorageData('tasks');
    const taskJson = json.find(item => +item.id === +target.dataset.id);

    if (taskJson && target.value.trim() !== taskJson.text) {
      taskJson.text = target.value.trim() || 'Без названия';
      setLocalStorageData('tasks', json);
      renderTasks();
    }
  }

  // Step checkbox
  if (target.closest('.step__checkbox')) {
    const json = getLocalStorageData('tasks');
    const step = target.closest('.step');
    const stepsItems = target.closest('.steps__items');
    json
      .find(item => +item.id === +stepsItems.dataset.id)
      .steps.find(item => +item.id === +step.dataset.id).completed =
      target.checked;

    step.classList.toggle('_completed');

    setLocalStorageData('tasks', json);
  }

  // Editing step text
  if (target.closest('.step__text')) {
    editStepText(target);
  }
});

document.addEventListener('keydown', function (event) {
  const target = event.target;

  // Adding new task
  if (event.shiftKey && event.code === 'Equal') {
    addNewTask();
    event.preventDefault();
  }

  // Editing step text
  if (event.code === 'Enter' && target.closest('.step__text')) {
    editStepText(target);
  }
});

window.onbeforeunload = function () {
  return false;
};

//<FUNCTIONS>==============================================================================

function editStepText(target) {
  const json = getLocalStorageData('tasks');
  const step = target.closest('.step');
  const stepsItems = target.closest('.steps__items');
  const stepJson = json
    .find(item => +item.id === +stepsItems.dataset.id)
    .steps.find(item => +item.id === +step.dataset.id);

  if (stepJson && target.value.trim() !== stepJson.text) {
    stepJson.text = target.value.trim() || 'Без названия';
    target.value = stepJson.text;
    setLocalStorageData('tasks', json);
  }
}

function closeEditingModal() {
  editingModal.classList.remove('_open');
  document.removeEventListener('focusin', modalFocus);
  lastActiveEditButton.focus();
}

function modalFocus(event) {
  if (event.target.closest('.modal')) {
    modalActiveElement = event.target;
  } else {
    event.target.blur();
    modalActiveElement.focus();
  }
}

function openEditingModal(json) {
  const modalCheckbox = editingModal.querySelector('#modal-checkbox');
  const modalText = editingModal.querySelector('#modal-text');
  const modalDelete = editingModal.querySelector('.modal__delete');
  const modalAddStep = editingModal.querySelector('.steps__new');
  const steps = editingModal.querySelector('.steps__items');

  modalCheckbox.dataset.id = json.id;
  modalText.dataset.id = json.id;
  modalDelete.dataset.id = json.id;
  modalAddStep.dataset.id = json.id;
  steps.dataset.id = json.id;

  modalCheckbox.checked = json.completed;
  modalText.value = json.text;

  if (modalText.classList.contains('_completed')) {
    modalText.classList.remove('_completed');
  }

  if (json.completed) {
    modalText.classList.add('_completed');
  }

  steps.innerHTML = '';

  json.steps.forEach(step => {
    steps.innerHTML += /* html */ `
      <div class="steps__item step ${
        step.completed ? '_completed' : ''
      }" data-id="${step.id}">
        <div class="step__checkbox">
          <input ${step.completed ? 'checked' : ''}
            id="step-${step.id}"
            class="custom-checkbox"
            type="checkbox"
          >
          <label for="step-${step.id}">
            <span></span>
          </label>
        </div>
        <div class="step__content">
          <input class="step__text task-text" value="${
            step.text
          }" placeholder="Название..." type="text">
          <button name="delete step" class="step__delete button _icon-delete" type="button"></button>
        </div>
      </div>
    `;
  });

  editingModal.classList.add('_open');
  document.addEventListener('focusin', modalFocus);
  lastActiveEditButton = document.activeElement;
  modalText.focus();
}

function deleteTask(json, taskId) {
  if (json.length) {
    const delIndex = json.findIndex(task => +task.id === +taskId);

    if (delIndex !== -1) {
      json.splice(delIndex, 1);
      return json;
    }
  }
}

function addNewTask() {
  const json = getLocalStorageData('tasks');

  let taskId = 1;

  if (json.length) {
    json.forEach(item => {
      if (item.id > taskId) {
        taskId = item.id;
      }
    });

    taskId++;
  }

  activeTasksRoot.insertAdjacentHTML(
    'afterbegin',
    /* html */ `
      <div class="tasks__task task"
        data-id="${taskId}"
        data-text="Без названия"
      >
        <div class="task__checkbox check-task">
          <input
            id="${taskId}"
            data-id="${taskId}"
            type="checkbox"
            class="custom-checkbox"
            name="set task completed"
          >
          <label for="${taskId}">
            <span></span>
          </label>
        </div>
        <input id="new-input" type="text" placeholder="Название..." class="task__text task-text" name="task description">
        <div class="task__buttons">
          <button data-id="${taskId}" name="edit task" class="button task-edit _icon-edit" type="button"
            title="Редактировать"></button>
          <button data-id="${taskId}" name="delete task" class="button task-delete _icon-delete" type="button"
            title="Удалить"></button>
        </div>
      </div>
    `,
  );

  const newInput = activeTasksRoot.querySelector('#new-input');
  newInput.focus();

  newInput.onblur = newInput.onkeydown = function (event) {
    if (
      (event.type === 'keydown' && event.code === 'Enter') ||
      event.type === 'blur'
    ) {
      newInput.onblur = newInput.onkeydown = null;

      const task = newInput.closest('.task');

      if (newInput.value.trim()) {
        task.dataset.text = newInput.value.trim();
      }

      json.push({
        id: +task.dataset.id,
        text: task.dataset.text,
        completed: false,
        steps: [],
      });

      setLocalStorageData('tasks', json);
      renderTasks();
    }
  };
}

function renderTasks() {
  const json = getLocalStorageData('tasks');
  const activeTasksCount = document.querySelector(
    '#active-tasks .tasks__count',
  );
  const completedTasksCount = document.querySelector(
    '#completed-tasks .tasks__count',
  );

  activeTasksRoot.innerHTML = '';
  completedTasksRoot.innerHTML = '';

  json.forEach(task => {
    const taskHTML = /* html */ `
      <div class="tasks__task task"
        data-id="${task.id}"
        data-text="${task.text}"
      >
        <div class="task__checkbox check-task">
          <input ${task.completed ? 'checked' : ''}
            id="${task.id}"
            data-id="${task.id}"
            type="checkbox"
            class="custom-checkbox"
            name="${task.completed ? 'set task active' : 'set task completed'}"
          >
          <label for="${task.id}">
            <span></span>
          </label>
        </div>
        <button name="task description" class="task__text task-text" type="button">
          ${task.text}
        </button>
        <div class="task__buttons">
          <button data-id="${
            task.id
          }" name="edit task" class="button task-edit _icon-edit" type="button"
            title="Редактировать"></button>
          <button data-id="${
            task.id
          }" name="delete task" class="button task-delete _icon-delete" type="button"
            title="Удалить"></button>
        </div>
      </div>
    `;

    if (task.completed) {
      completedTasksRoot.insertAdjacentHTML('afterbegin', taskHTML);
    } else {
      activeTasksRoot.insertAdjacentHTML('afterbegin', taskHTML);
    }
  });

  activeTasksCount.textContent = activeTasksRoot.children.length;
  completedTasksCount.textContent = completedTasksRoot.children.length;

  if (!activeTasksRoot.children.length) {
    activeTasksRoot.innerHTML = /* html */ `
      <div style='text-align: center; padding: 20px; font-size: 1.2rem'>Новых дел нет...</div>
    `;
  }

  if (completedTasksRoot.children.length) {
    document.querySelector('#completed-tasks').hidden = false;
  } else {
    document.querySelector('#completed-tasks').hidden = true;
  }
}

function getLocalStorageData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setLocalStorageData(key, json) {
  localStorage.setItem(key, JSON.stringify(json));
}

//</FUNCTIONS>==============================================================================
