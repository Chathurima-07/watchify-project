import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function ExamPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const fetchExam = async () => {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/exams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const selected = res.data.find((e) => e._id === id);
      setExam(selected);
      setAnswers(new Array(selected.questions.length).fill(""));
    };

    fetchExam();
  }, [id]);

  const handleChange = (qIndex, option) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      "http://localhost:5000/api/exams/submit",
      {
        examId: id,
        answers,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(`Score: ${res.data.score}/${res.data.total}`);
  };

  if (!exam) return <p>Loading...</p>;

  return (
    <div>
      <h2>{exam.title}</h2>

      {exam.questions.map((q, index) => (
        <div key={index}>
          <p>{q.question}</p>

          {q.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name={`q-${index}`}
                value={opt}
                onChange={() => handleChange(index, opt)}
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleSubmit}>Submit Exam</button>
    </div>
  );
}

export default ExamPage;