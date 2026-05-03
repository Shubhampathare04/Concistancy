import { registerRootComponent } from 'expo';
// Background sync task must be defined before the app mounts
import './src/services/backgroundSync';
import App from './App';

registerRootComponent(App);
