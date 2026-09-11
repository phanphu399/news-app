import { registerRootComponent } from 'expo';
import App from './App';
import { ensureWebPwa } from './src/utils/webPwa';

ensureWebPwa();

registerRootComponent(App);