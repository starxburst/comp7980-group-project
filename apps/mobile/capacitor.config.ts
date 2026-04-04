import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.petstagram.app',
  appName: 'Petstagram',
  webDir:  'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
