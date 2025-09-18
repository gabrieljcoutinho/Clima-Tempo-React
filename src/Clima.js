// Clima.jsx
import React, { useState, useEffect, useCallback } from 'react';
import '../src/index.css';

const WEATHER_ICONS = {
  Ensolarado: '☀️',
  Nublado: '☁️',
  Chuvoso: '🌧️',
  'Parcialmente Nublado': '⛅',
  'Céu limpo': '☀️',
  'Tempo nublado': '☁️',
  'Chuva leve': '🌧️',
  Limpo: '☀️',
  Tempestade: '⛈️',
  'Noite Limpa': '🌙'
};

// Coloque aqui sua chave da API
const OPENWEATHER_API_KEY = "";

const Clima = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const isNight = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  };

  const getWeatherIcon = useCallback(c => {
    const normalizedCondition = (c || '').toLowerCase();

    if ((normalizedCondition.includes('céu limpo') || normalizedCondition.includes('limpo') || normalizedCondition.includes('sol')) && isNight()) {
      return <span className="wf-icon">{WEATHER_ICONS['Noite Limpa']}</span>;
    }

    if (normalizedCondition.includes('sol') || normalizedCondition.includes('limpo')) {
      return <span className="wf-icon">{WEATHER_ICONS['Ensolarado']}</span>;
    } else if (normalizedCondition.includes('nublado')) {
      return <span className="wf-icon">{WEATHER_ICONS['Nublado']}</span>;
    } else if (normalizedCondition.includes('chuva')) {
      return <span className="wf-icon">{WEATHER_ICONS['Chuvoso']}</span>;
    } else if (normalizedCondition.includes('tempestade')) {
      return <span className="wf-icon">{WEATHER_ICONS['Tempestade']}</span>;
    } else {
      return <span className="wf-icon">{WEATHER_ICONS['Nublado']}</span>;
    }
  }, []);

  const fetchWeather = async (city = 'São Paulo') => {
    if (!OPENWEATHER_API_KEY) return; // não faz nada sem chave

    setWeatherLoading(true);

    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=pt_br`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=pt_br`;

      const [weatherRes, forecastRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
      if (!weatherRes.ok || !forecastRes.ok) throw new Error("Cidade não encontrada.");

      const weatherJson = await weatherRes.json();
      const forecastJson = await forecastRes.json();

      const dailyForecasts = forecastJson.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 3);
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);

      const formattedForecast = dailyForecasts.map((item, i) => {
        let dayLabel = 'Hoje';
        if (i === 1) dayLabel = tomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (i === 2) dayLabel = dayAfterTomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return {
          day: dayLabel,
          condition: item.weather[0].description,
          high: item.main.temp_max,
          low: item.main.temp_min
        };
      });

      setWeatherData({
        current: {
          temperature: weatherJson.main.temp,
          condition: weatherJson.weather[0].description,
          humidity: weatherJson.main.humidity,
          windSpeed: weatherJson.wind.speed
        },
        forecast: formattedForecast
      });

    } catch (error) {
      console.error(error.message);
      setWeatherData(null); // não há dados reais, mas layout será mostrado
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => { fetchWeather(); }, []);

  return (
    <section className="wf-section">
      <h2>Previsão do Tempo</h2>
      <div className="wf-card-container">

        {/* Card Atual */}
        <div className="wf-card">
          <h3>Agora</h3>
          <p className="wf-temp">{weatherData ? Math.round(weatherData.current.temperature) + '°C' : '--°C'}</p>
          <p className="wf-condition">
            {getWeatherIcon(weatherData ? weatherData.current.condition : '')}
            {weatherData ? weatherData.current.condition : '---'}
          </p>
          <p className="wf-condition-text">Umidade: {weatherData ? weatherData.current.humidity + '%' : '--%'}</p>
          <p className="wf-condition-text">Vento: {weatherData ? (weatherData.current.windSpeed * 3.6).toFixed(1) + ' km/h' : '-- km/h'}</p>
        </div>

        {/* Forecast */}
        {[0, 1, 2].map(i => {
          const forecast = weatherData ? weatherData.forecast[i] : null;
          const dayLabel = forecast ? forecast.day : ['Hoje', 'Amanhã', 'Depois de Amanhã'][i];
          return (
            <div key={i} className="wf-card">
              <h3>{dayLabel}</h3>
              <p className="wf-icon">{getWeatherIcon(forecast ? forecast.condition : '')}</p>
              <p className="wf-range">
                Min: {forecast ? Math.round(forecast.low) + '°C' : '--°C'} | Max: {forecast ? Math.round(forecast.high) + '°C' : '--°C'}
              </p>
              <p className="wf-condition-text">{forecast ? forecast.condition : '---'}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Clima;
