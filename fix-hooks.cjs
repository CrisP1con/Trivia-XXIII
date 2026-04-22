const fs = require('fs');

const path = 'src/game/GameView.jsx';
let content = fs.readFileSync(path, 'utf8');

const badBlock = `export default function GameView() {
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

const fixedBlock = `export default function GameViewWrapper() {
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

  if (loading || !gameData) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: 'white' }}><h2>Cargando experiencia...</h2></div>;
  }

  return <GameView gameData={gameData} />;
}

function GameView({ gameData }) {
  const totalQuestions = useMemo(
    () => gameData.stations.reduce((acc, station) => acc + station.questions.length, 0),
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

  const station = gameData.stations[stationIndex];
  const question = station.questions[questionIndex];`;

content = content.replace(badBlock, fixedBlock);
fs.writeFileSync(path, content, 'utf8');
console.log('Hooks fixed!');
