import { ref } from 'vue'
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '@/services/task.service'

export function useTasks() {
  const tasks = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTasks = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await getTasks()
      tasks.value = res.data ?? []
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar tareas'
    } finally {
      loading.value = false
    }
  }

  const addTask = async (data: object) => {
    const res = await createTask(data)
    await fetchTasks()
    return res.data
  }

  const editTask = async (id: string, data: object) => {
    const res = await updateTask(id, data)
    await fetchTasks()
    return res.data
  }

  const changeStatus = async (id: string, status: string) => {
    const res = await updateTaskStatus(id, status)
    await fetchTasks()
    return res.data
  }

  const removeTask = async (id: string) => {
    await deleteTask(id)
    await fetchTasks()
  }

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    editTask,
    changeStatus,
    removeTask,
  }
}
