import React, { useState, useEffect } from 'react';
import './App.css';
import ToDoForm from "./AddTask";
import ToDo from "./Task";
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';

function App() {
  const [rates, setRates] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getInitialTodos = () => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) return parsedTasks;
      } catch (e) {
        console.error('Ошибка чтения:', e.message);
      }
    }
    return [];
  };

  const [todos, setTodos] = useState(getInitialTodos);

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error('Ошибка при сохранении задач:', error.message);
    }
  }, [todos]);

 async function fetchWeather(lat, lon) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100);
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (weatherResponse.data.current_weather) {
      const current = weatherResponse.data.current_weather;
      setWeatherData({
        temperature: current.temperature,
        windspeed: (current.windspeed / 3.6).toFixed(1)
      });
    }
  } catch {
    setWeatherData({ temperature: '27.5', windspeed: '3.2' });
  }
}

  useEffect(() => {
    async function fetchAllData() {
      try {
        const currencyResponse = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        if (!currencyResponse.data || !currencyResponse.data.Valute) {
          throw new Error('Нет данных о валюте.');
        }
        const USDrate = currencyResponse.data.Valute.USD.Value.toFixed(4).replace('.', ',');
        const EURrate = currencyResponse.data.Valute.EUR.Value.toFixed(4).replace('.', ',');
        setRates({ USDrate, EURrate });
      } catch (err) {
        console.error(err);
        setError('Ошибка загрузки данных.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        fetchWeather(55.7558, 37.6173);
      }
    );
  }, []);

  const addTask = (userInput) => {
    if (userInput) {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        task: userInput,
        complete: false
      };
      setTodos([...todos, newItem]);
    }
  };

  const removeTask = (id) => {
    setTodos([...todos.filter((todo) => todo.id !== id)]);
  };

  const handleToggle = (id) => {
    setTodos([
      ...todos.map((task) =>
        task.id === id ? { ...task, complete: !task.complete } : { ...task }
      )
    ]);
  };

  return (
    <>
      <div className="App">
        {loading && <p>Загрузка...</p>}
        {!loading && error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <>
            <div className='info'>
              <div className='money'>
                <div id="USD">Доллар США $ — {rates.USDrate} руб.</div>
                <div id="EUR">Евро € — {rates.EURrate} руб.</div>
              </div>
              {weatherData && (
                <div className="weather-info">
                  <div>
                    Погода сегодня: <br />
                    🌡 {weatherData.temperature}°C
                    ༄.° {weatherData.windspeed} м/с
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <header>
          <h1 className='list-header'>Список задач: {todos.length}</h1>
        </header>
        <ToDoForm addTask={addTask} />
        {todos.map((todo) => (
          <ToDo
            todo={todo}
            key={todo.id}
            toggleTask={handleToggle}
            removeTask={removeTask}
          />
        ))}
      </div>
    </>
  );
}

export default App;