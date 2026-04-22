import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOGO_PATH = "/logo.png";

function createSafeAudio(src) {
  if (typeof Audio === "undefined") {
    return { play: () => Promise.resolve() };
  }

  const audio = new Audio(src);
  audio.preload = "auto";

  return {
    play: () => {
      try {
        audio.currentTime = 0;
        const result = audio.play();
        if (result?.catch) result.catch(() => {});
        return result;
      } catch {
        return Promise.resolve();
      }
    },
  };
}

const sounds = {
  click: createSafeAudio("/click.mp3"),
  correct: createSafeAudio("/correct.mp3"),
  wrong: createSafeAudio("/wrong.mp3"),
  transition: createSafeAudio("/transition.mp3"),
  win: createSafeAudio("/win.mp3"),
};

function AppButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`app-btn ${variant} ${className}`}
    >
      {children}
    </button>
  );
}

function IntroScreen({ onStart, totalQuestions, gameData }) {
  return (
    <div className="screen intro-screen">
      <motion.img
        src={LOGO_PATH}
        alt="Logo Instituto Juan XXIII"
        className="intro-logo"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />

      <motion.h1
        className="intro-title"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {gameData.title}
      </motion.h1>

      <motion.p
        className="intro-subtitle"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {gameData.subtitle}
      </motion.p>

      <p className="intro-text">
        Modo equipos: rojo contra azul. Cada época comienza con un video y luego
        llega la tanda de preguntas.
      </p>

      <div className="intro-badges">
        <div className="badge red">🔴 Equipo Rojo</div>
        <div className="badge blue">🔵 Equipo Azul</div>
        <div className="badge glass">{gameData.stations.length} épocas</div>
        <div className="badge glass">{totalQuestions} preguntas</div>
      </div>

      <AppButton onClick={onStart} className="large-btn">
        Comenzar
      </AppButton>
    </div>
  );
}

function Scoreboard({
  score,
  teamTurn,
  stationTitle,
  timeLeft,
  stationIndex,
  totalStations,
  questionIndex,
  totalQuestions,
}) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-top">
        <div className="brand">
          <img src={LOGO_PATH} alt="Logo" className="brand-logo" />
          <div>
            <p className="brand-title">Instituto Juan XXIII</p>
            <p className="brand-subtitle">
              60 años educando con historia y futuro
            </p>
          </div>
        </div>

        <div className="meta-grid">
          <div className="meta-box">
            Época {stationIndex + 1} / {totalStations}
          </div>
          <div className="meta-box">
            Pregunta {questionIndex + 1} / {totalQuestions}
          </div>
          <div className="meta-box">⏱️ {timeLeft}s</div>
        </div>
      </div>

      <div className="score-row">
        <div className={`team-card red ${teamTurn !== "rojo" ? "inactive" : ""}`}>🔴 Rojo: {score.rojo}</div>
        <div className={`turn-card ${teamTurn === "rojo" ? "red-turn" : "blue-turn"}`}>
          Turno de: {teamTurn === "rojo" ? "Equipo Rojo" : "Equipo Azul"}
        </div>
        <div className={`team-card blue ${teamTurn !== "azul" ? "inactive" : ""}`}>🔵 Azul: {score.azul}</div>
      </div>

      <div className="station-name">{stationTitle}</div>
    </div>
  );
}

function VideoStage({ station, onContinue }) {
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    setEnded(false);
    setPlayError(false);
    sounds.transition.play();

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const attempt = video.play();
    if (attempt?.catch) {
      attempt.catch(() => {
        setPlayError(true);
      });
    }
  }, [station.title]);

  return (
    <div className="screen video-screen">
      <motion.img
        src={LOGO_PATH}
        alt="Logo"
        className="video-logo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.h2
        className="video-title"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {station.title}
      </motion.h2>

      <motion.p
        className="video-bridge"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {station.bridge}
      </motion.p>

      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={station.video}
          className="video-player"
          controls
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => {
            setEnded(true);
            onContinue(); // Transición automática al terminar
          }}
        />
      </div>

      <div className="video-actions">
        <AppButton
          onClick={onContinue}
          disabled={!ended && !playError}
          className="medium-btn"
        >
          {ended
            ? "Comenzar preguntas"
            : playError
            ? "Seguir sin video"
            : "Esperando fin del video..."}
        </AppButton>

        <AppButton
          onClick={onContinue}
          variant="secondary"
          className="medium-btn"
        >
          Saltar video
        </AppButton>
      </div>

      <p className="video-note">
        El juego queda bloqueado hasta que termine el video, salvo que el docente
        decida saltearlo.
      </p>
    </div>
  );
}

function Feedback({ isCorrect, explanation, teamTurn }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`feedback ${isCorrect ? "correct" : "wrong"}`}
    >
      <p className="feedback-title">
        {isCorrect
          ? `¡Punto para el equipo ${teamTurn === "rojo" ? "rojo" : "azul"}!`
          : "No era esa. La historia aprieta, pero enseña."}
      </p>
      <p className="feedback-text">{explanation}</p>
    </motion.div>
  );
}

function QuestionStage({
  station,
  question,
  score,
  teamTurn,
  timeLeft,
  stationIndex,
  totalStations,
  questionIndex,
  onAnswer,
  isLocked,
  feedback,
}) {
  return (
    <div className="question-screen">
      <Scoreboard
        score={score}
        teamTurn={teamTurn}
        stationTitle={station.title}
        timeLeft={timeLeft}
        stationIndex={stationIndex}
        totalStations={totalStations}
        questionIndex={questionIndex}
        totalQuestions={station.questions.length}
      />

      <div className="question-container">
        <motion.div
          key={`${station.title}-${questionIndex}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="question-stack"
        >
          <section className="panel">
            <p className="section-kicker">Turno activo</p>
            <h2 className={`turn-title ${teamTurn === "rojo" ? "red-text" : "blue-text"}`}>
              {teamTurn === "rojo"
                ? "🔴 Responde el equipo rojo"
                : "🔵 Responde el equipo azul"}
            </h2>
            <p className="panel-text">
              Leé, pensá, tocá y avanzá. La historia no espera dormidos.
            </p>
          </section>

          <section className="panel">
            <p className="section-kicker blue-kicker">Pregunta</p>
            <h3 className="question-prompt">{question.prompt}</h3>

            <div className="options-grid">
              {question.options.map((option, index) => (
                <AppButton
                  key={`${question.prompt}-${index}`}
                  onClick={() => onAnswer(index)}
                  disabled={isLocked}
                  variant="option"
                  className="option-btn"
                >
                  <span className={`option-letter ${teamTurn === "rojo" ? "red-text-dark" : "blue-text-dark"}`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                </AppButton>
              ))}
            </div>

            <AnimatePresence>
              {feedback && (
                <Feedback
                  isCorrect={feedback.isCorrect}
                  explanation={feedback.explanation}
                  teamTurn={teamTurn}
                />
              )}
            </AnimatePresence>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

function FinalStage({ score, onRestart, onBack }) {
  const winner =
    score.rojo === score.azul ? "empate" : score.rojo > score.azul ? "rojo" : "azul";

  useEffect(() => {
    sounds.win.play();
  }, []);

  return (
    <div className="screen final-screen">
      <motion.img
        src={LOGO_PATH}
        alt="Logo"
        className="final-logo"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />

      <h1 className="final-title">Final de la experiencia</h1>

      <div className="final-score-grid">
        <div className="final-score red">🔴 Rojo: {score.rojo}</div>
        <div className="final-score blue">🔵 Azul: {score.azul}</div>
      </div>

      <p className="winner-text">
        {winner === "empate"
          ? "⚖️ Empate histórico"
          : winner === "rojo"
          ? "🏆 Gana el equipo rojo"
          : "🏆 Gana el equipo azul"}
      </p>

      <p className="final-message">
        60 años formando memoria, pensamiento y futuro. La historia no se
        memoriza solamente: se vive, se discute y se comprende.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <AppButton onClick={onRestart} className="medium-btn">
          Volver a jugar
        </AppButton>
        {onBack && (
          <AppButton onClick={onBack} variant="secondary" className="medium-btn">
            Cambiar materia
          </AppButton>
        )}
      </div>
    </div>
  );
}

function MateriaSelectScreen({ onSelect }) {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/game-materias")
      .then(res => res.json())
      .then(data => {
        setMaterias(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: 'white' }}><h2>Cargando materias...</h2></div>;
  }

  return (
    <div className="screen intro-screen">
      <motion.img
        src={LOGO_PATH}
        alt="Logo Instituto Juan XXIII"
        className="intro-logo"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />

      <motion.h1
        className="intro-title"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Elegí la materia
      </motion.h1>

      <motion.p
        className="intro-subtitle"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Seleccioná sobre qué querés jugar hoy
      </motion.p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '2rem', maxWidth: '600px' }}>
        {materias.map(m => (
          <motion.button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="app-btn primary large-btn"
            style={{ minWidth: '200px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {m.nombre}
          </motion.button>
        ))}
        {materias.length === 0 && (
          <p className="intro-text">No hay materias cargadas. Agregá una desde el panel de administración.</p>
        )}
      </div>
    </div>
  );
}

export default function GameViewWrapper() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);

  const handleSelectMateria = (materiaId) => {
    setSelectedMateria(materiaId);
    setLoading(true);
    fetch(`/api/game-data/${materiaId}`)
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching game data:", err);
        setLoading(false);
      });
  };

  const handleBack = () => {
    setSelectedMateria(null);
    setGameData(null);
  };

  if (!selectedMateria) {
    return <MateriaSelectScreen onSelect={handleSelectMateria} />;
  }

  if (loading || !gameData) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: 'white' }}><h2>Cargando experiencia...</h2></div>;
  }

  if (!gameData.stations || gameData.stations.length === 0) {
    return (
      <div className="screen intro-screen">
        <h2 className="intro-title" style={{ marginBottom: '1rem' }}>Sin contenido</h2>
        <p className="intro-subtitle">Esta materia no tiene temas con preguntas cargadas.</p>
        <AppButton onClick={handleBack} className="medium-btn" style={{ marginTop: '2rem' }}>
          Volver a elegir materia
        </AppButton>
      </div>
    );
  }

  return <GameView gameData={gameData} onBack={handleBack} />;
}

function GameView({ gameData, onBack }) {
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
  const question = station.questions[questionIndex];

  useEffect(() => {
    if (!started || finished || showVideoStage || isLocked) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [started, finished, showVideoStage, isLocked, timeLeft]);

  const goToNext = () => {
    const hasMoreQuestions = questionIndex < station.questions.length - 1;
    const hasMoreStations = stationIndex < gameData.stations.length - 1;

    if (hasMoreQuestions) {
      setQuestionIndex((prev) => prev + 1);
    } else if (hasMoreStations) {
      setStationIndex((prev) => prev + 1);
      setQuestionIndex(0);
      setShowVideoStage(true);
    } else {
      setFinished(true);
    }

    setTeamTurn((prev) => (prev === "rojo" ? "azul" : "rojo"));
    setTimeLeft(15);
    setFeedback(null);
    setIsLocked(false);
  };

  const handleAnswer = (selectedIndex) => {
    if (isLocked) return;

    setIsLocked(true);
    sounds.click.play();

    const isCorrect = selectedIndex === question.answer;

    if (isCorrect) {
      sounds.correct.play();
      setScore((prev) => ({
        ...prev,
        [teamTurn]: prev[teamTurn] + 1,
      }));
    } else {
      sounds.wrong.play();
    }

    setFeedback({
      isCorrect,
      explanation:
        question.explanation || "La historia sigue. Vamos a la próxima.",
    });

    window.setTimeout(() => {
      goToNext();
    }, 1500);
  };

  const handleTimeout = () => {
    if (isLocked) return;

    setIsLocked(true);
    setFeedback({
      isCorrect: false,
      explanation:
        "Se acabó el tiempo. En historia, como en la vida, a veces hay que decidir antes de que suene la campana.",
    });

    window.setTimeout(() => {
      goToNext();
    }, 1300);
  };

  const handleStartQuestions = () => {
    setShowVideoStage(false);
    setTimeLeft(15);
    setFeedback(null);
    setIsLocked(false);
  };

  const handleRestart = () => {
    setStarted(false);
    setFinished(false);
    setStationIndex(0);
    setQuestionIndex(0);
    setShowVideoStage(true);
    setTeamTurn("rojo");
    setScore({ rojo: 0, azul: 0 });
    setTimeLeft(15);
    setIsLocked(false);
    setFeedback(null);
  };

  if (!started) {
    return (
      <IntroScreen
        onStart={() => setStarted(true)}
        totalQuestions={totalQuestions}
        gameData={gameData}
      />
    );
  }

  if (finished) {
    return <FinalStage score={score} onRestart={handleRestart} onBack={onBack} />;
  }

  if (showVideoStage) {
    return <VideoStage station={station} onContinue={handleStartQuestions} />;
  }

  return (
    <QuestionStage
      station={station}
      question={question}
      score={score}
      teamTurn={teamTurn}
      timeLeft={timeLeft}
      stationIndex={stationIndex}
      totalStations={gameData.stations.length}
      questionIndex={questionIndex}
      onAnswer={handleAnswer}
      isLocked={isLocked}
      feedback={feedback}
    />
  );
}
