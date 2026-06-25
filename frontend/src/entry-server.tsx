import { jsx } from 'react/jsx-runtime';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import './App.css';

export function createApp(url: string, helmetContext: { helmet?: any }) {
  return jsx(HelmetProvider, { context: helmetContext, children: jsx(StaticRouter, { location: url, children: jsx(App, {}) }) });
}
