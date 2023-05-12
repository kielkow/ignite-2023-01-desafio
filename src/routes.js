import { randomUUID } from 'node:crypto';

import { Database } from './database.js';
import { buildRoutePath } from './utils/build-route-path.js';

const database = new Database();

export const routes = [
    {
        method: 'GET',
        path: buildRoutePath('/tasks'),
        handler: (req, res) => {
            const { search } = req.query;

            const tasks = database.select(
                'tasks',
                search
                    ? {
                        title: search,
                        description: search,
                    } : null
            );

            return res.end(JSON.stringify(tasks));
        },
    },
    {
        method: 'POST',
        path: buildRoutePath('/tasks'),
        handler: (req, res) => {
            const { title, description } = req.body;

            const task = {
                id: randomUUID(),
                title,
                description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                completed_at: null,
            };

            database.insert('tasks', task);

            return res.writeHead(201).end();
        },
    },
    {
        method: 'DELETE',
        path: buildRoutePath('/tasks/:id'),
        handler: (req, res) => {
            const { id } = req.params;

            database.delete('tasks', id);

            return res.writeHead(204).end();
        },
    },
    {
        method: 'PUT',
        path: buildRoutePath('/tasks/:id'),
        handler: (req, res) => {
            const { id } = req.params;
            const { title, description } = req.body;

            const [task] = database.select('tasks', { id });
            if (!task) {
                return res.writeHead(400).end(JSON.stringify({
                    message: 'task not found'
                }));
            }

            database.update('tasks', id, { 
                title, 
                description,
                created_at: task.created_at,
                updated_at: new Date().toISOString(),
                completed_at: task.completed_at,
            });

            return res.writeHead(204).end();
        },
    },
    {
        method: 'GET',
        path: buildRoutePath('/tasks/:id'),
        handler: (req, res) => {
            const { id } = req.params;

            const task = database.select('tasks', { id });

            return res.end(JSON.stringify(task));;
        },
    },
];
