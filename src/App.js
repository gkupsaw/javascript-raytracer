import logo from './assets/logo.svg';
import './css/App.css';
import { runRaytracer } from './utils';
// import { runTests } from './utils/raytracing/ImplicitShapes.tests';

function App() {
    return (
        <div className='App'>
            <header className='App-header'>
                <img src={logo} className='App-logo' alt='logo' />
                <p>
                    <button onClick={runRaytracer}>Run Raytracer</button>
                </p>
            </header>
        </div>
    );
}

export default App;
