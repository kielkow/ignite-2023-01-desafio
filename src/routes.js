import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parse } from 'csv-parse';

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
            if (!req.body && fs.existsSync('./tasks.csv')) {
                fs.createReadStream('./tasks.csv')
                    .pipe(
                        parse({ delimiter: ",", from_line: 2 }) // pula a primeira linha
                    )
                    .on(
                        'data', (task) => {
                            database.insert('tasks', {
                                id: randomUUID(),
                                title: task[0],
                                description: task[1],
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                completed_at: null,
                            });
                        }
                    )
                    .on("end", function () {
                        return res.writeHead(201).end(
                            JSON.stringify({ message: 'tasks imported' })
                        );
                    })
                    .on("error", function (error) {
                        return res.writeHead(400).end(JSON.stringify({
                            message: error.message || error
                        }));
                    });
            } else {
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
            }
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
    {
        method: 'PATCH',
        path: buildRoutePath('/tasks/:id/complete'),
        handler: (req, res) => {
            const { id } = req.params;

            const [task] = database.select('tasks', { id });

            if (!task) {
                return res.writeHead(400).end(JSON.stringify({
                    message: 'task not found'
                }));
            }

            if (task.completed_at) {
                return res.writeHead(400).end(JSON.stringify({
                    message: 'task already completed'
                }));
            }

            database.update('tasks', id, {
                title: task.title,
                description: task.description,
                created_at: task.created_at,
                updated_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            });

            return res.writeHead(204).end();
        },
    },
];
