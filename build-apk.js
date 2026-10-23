const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const VERSION = require('./package.json').version;
const ENTREGA = path.join(os.homedir(), 'Desktop', 'JFJerseys-APK');
const PROPS = path.join(ENTREGA, 'llaves', 'keystore.properties');

const env = Object.assign({}, process.env);
const jdks = path.join(os.homedir(), '.jdks');
if (fs.existsSync(jdks)) {
    const jdk = fs.readdirSync(jdks).filter(d => /^jdk-(17|21)\./.test(d)).sort().pop();
    if (jdk) env.JAVA_HOME = path.join(jdks, jdk);
}
env.ANDROID_HOME = env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
env.ANDROID_SDK_ROOT = env.ANDROID_HOME;
if (!fs.existsSync(PROPS)) {
    console.error('Falta la llave de firma: ' + PROPS);
    process.exit(1);
}
env.JF_KEYSTORE_PROPS = PROPS;

const gradle = path.join(__dirname, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const r = spawnSync(gradle, ['assembleRelease', '--console=plain', '-q'], { cwd: path.join(__dirname, 'android'), env, stdio: 'inherit', shell: process.platform === 'win32' });
if (r.status !== 0) process.exit(r.status || 1);

const origen = path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
fs.mkdirSync(ENTREGA, { recursive: true });
const destino = path.join(ENTREGA, 'JFJerseys-' + VERSION + '.apk');
fs.copyFileSync(origen, destino);
console.log('APK listo: ' + destino + ' (' + (fs.statSync(destino).size / 1048576).toFixed(1) + ' MB)');
