import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Task, Animal, User, LogType } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useTaskData = () => {
  const { profile: currentUser } = useAuthStore();
  const [filter, setFilter] = useState<'assigned' | 'pending' | 'completed'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');

  const data = useLiveQuery(async () => {
    try {
      const [tasks, animals, users] = await Promise.all([
        db.tasks.toArray(),
        db.animals.toArray(),
        db.users.toArray()
      ]);
      return { tasks, animals, users };
    } catch (e) {
      console.error("Dexie error in useTaskData:", e);
      return { tasks: [], animals: [], users: [] };
    }
  }, []);

  const isLoading = data === undefined;

  const sanitizedTasks = useMemo(() => {
    if (!data?.tasks) return [];
    return data.tasks.map(task => ({
      ...task,
      id: String(task.id || ''),
      title: String(task.title || 'Untitled Task'),
      type: String(task.type || LogType.GENERAL) as LogType,
      animalId: task.animalId ? String(task.animalId) : undefined,
      dueDate: String(task.dueDate || ''),
      assignedTo: task.assignedTo ? String(task.assignedTo) : undefined,
      completed: !!task.completed
    }));
  }, [data?.tasks]);

  const sanitizedAnimals = useMemo(() => {
      if (!data?.animals) return [];
      return data.animals.map(a => ({
          ...a,
          id: String(a.id || ''),
          name: String(a.name || 'Unknown')
      }));
  }, [data?.animals]);

  const filteredTasks = useMemo(() => {
    let list = sanitizedTasks;

    if (filter === 'assigned') {
      list = list.filter(t => !t.completed && t.assignedTo === currentUser?.id);
    } else if (filter === 'pending') {
      list = list.filter(t => !t.completed);
    } else if (filter === 'completed') {
      list = list.filter(t => t.completed);
    }

    if (searchTerm) {
      list = list.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [sanitizedTasks, filter, currentUser?.id, searchTerm]);

  const addTask = async (task: Omit<Task, 'id' | 'completed'>) => {
    await db.tasks.add({
      ...task,
      id: uuidv4(),
      completed: false,
      created_at: new Date(),
      updated_at: new Date()
    });
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await db.tasks.update(id, {
        ...updates,
        updated_at: new Date()
    });
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  const toggleTaskCompletion = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  return {
    tasks: filteredTasks,
    animals: sanitizedAnimals,
    users: data?.users || [],
    isLoading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    currentUser
  };
};
