const fs = require('fs');

const path = 'src/game/GameView.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Eliminar la constante gameData hardcodeada
const gameDataRegex = /const gameData = \{[\s\S]*?\n\};\n\nfunction AppButton/;
content = content.replace(gameDataRegex, 'function AppButton');

// 2. Modificar IntroScreen para que reciba gameData por props
content = content.replace(
  'function IntroScreen({ onStart, totalQuestions }) {',
  'function IntroScreen({ onStart, totalQuestions, gameData }) {'
);

// 3. Modificar GameView para tener estado de carga y el useEffect
const oldGameViewStart = `export default function GameView() {
  const totalQuestions = useMemo(
    () => gameData.stations.reduce((acc, station) => acc + station.questions.length, 0),
    []
  );

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stationIndex, setStationIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showVideoStage, setShowVideoStage] = useState(true);
  const [teamTurn, setTeamTurn] = useState("rojo");
  const [score, setScore] = useState({ rojo: 0, azul: 0 });
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const station = gameData.stations[stationIndex];
  const question = station.questions[questionIndex];`;

const newGameViewStart = `export default function GameView() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/game-data")
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching game data:", err);
        setLoading(false);
      });
  }, []);

  const totalQuestions = useMemo(
    () => gameData?.stations?.reduce((acc, station) => acc + station.questions.length, 0) || 0,
    [gameData]
  );

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stationIndex, setStationIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showVideoStage, setShowVideoStage] = useState(true);
  const [teamTurn, setTeamTurn] = useState("rojo");
  const [score, setScore] = useState({ rojo: 0, azul: 0 });
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (loading || !gameData) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: 'white' }}><h2>Cargando historia...</h2></div>;
  }

  const station = gameData.stations[stationIndex];
  const question = station.questions[questionIndex];`;

content = content.replace(oldGameViewStart, newGameViewStart);

// 4. Pasar gameData a IntroScreen en GameView
content = content.replace(
  '<IntroScreen\n        onStart={() => setStarted(true)}\n        totalQuestions={totalQuestions}\n      />',
  '<IntroScreen\n        onStart={() => setStarted(true)}\n        totalQuestions={totalQuestions}\n        gameData={gameData}\n      />'
);
content = content.replace(
  '<IntroScreen onStart={() => setStarted(true)} totalQuestions={totalQuestions} />',
  '<IntroScreen onStart={() => setStarted(true)} totalQuestions={totalQuestions} gameData={gameData} />'
);

// 5. Arreglar posibles referencias de gameData globales en goToNext
// No es necesario porque gameData está en el scope del componente ahora

fs.writeFileSync(path, content, 'utf8');
console.log('GameView.jsx refactored successfully.');
