import { useEffect, useState } from "react";
import "./App.css";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { generateUniqueId } from "./lib/utils";
import { DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";

interface Todo {
  id: string;
  name: string;
  is_completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoName, setTodoName] = useState("");
  const [todoCompleted, setTodoCompleted] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null);

  const handleAddOrEditTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTodoId !== null) {
      addOrEditTodo(currentTodoId);
    } else {
      addOrEditTodo();
    }
    setTodoName("");
    setTodoCompleted(false);
  };

  const addOrEditTodo = async (id?: string) => {
    const command = new PutCommand({
      TableName: "todo",
      Item: {
        id: id ?? generateUniqueId(),
        name: todoName,
        is_completed: todoCompleted,
      },
    });
    try {
      await docClient.send(command);
      getTodos();
      setCurrentTodoId(null);
    } catch (error) {}
  };

  const handleEditTodo = (id: string) => {
    setCurrentTodoId(id);
    const todo = todos?.find((item) => item?.id === id);
    if (!todo) {
      return;
    }
    setTodoName(todo.name);
    setTodoCompleted(todo.is_completed);
  };

  const handleDeleteTodo = async (todoId: string) => {
    const command = new DeleteCommand({
      TableName: "todo",
      Key: {
        id: todoId,
      },
    });
    await docClient.send(command);
    getTodos();
    setTodoName("");
    setTodoCompleted(false);
  };

  const getTodos = async () => {
    const command = new ScanCommand({
      TableName: "todo",
      // FilterExpression: "is_completed = :is_completed",
      // ExpressionAttributeValues: {
      //   ":is_completed": true,
      // },
    });
    try {
      const res = await docClient.send(command);
      setTodos(res?.Items as Todo[]);
    } catch (error) {}
  };

  useEffect(() => {
    getTodos();
  }, []);

  return (
    <div className="app-container">
      <h1 className="mb-4">Todo App</h1>
      <form className="todo-form" onSubmit={handleAddOrEditTodo}>
        <Input
          placeholder="Enter Todo Name"
          value={todoName}
          onChange={(e) => setTodoName(e.target.value)}
          className="todo-input"
          required
        />
        <div className="items-top flex space-x-2 mt-2 ml-1">
          <Checkbox
            id="is_completed"
            checked={todoCompleted}
            onCheckedChange={(checked) => setTodoCompleted(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="is_completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mark as completed
            </label>
          </div>
        </div>
        <Button type="submit" className="mt-4">
          {currentTodoId ? "Edit Todo" : "Add Todo"}
        </Button>
      </form>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <span className={todo?.is_completed ? "line-through" : ""}>
              {todo.name}
            </span>
            <div className="todo-actions">
              <Button
                onClick={() => handleEditTodo(todo.id)}
                variant="ghost"
                className="edit-button"
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDeleteTodo(todo.id)}
                variant="ghost"
                className="delete-button"
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
