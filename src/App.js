import React, { useEffect, useState } from "react";
import axios from "axios";
import PropertyCard from "./PropertyCard";
import "./App.css";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/properties`)
      .then((res) => setData(res.data));
  }, []);

  return (
    <>
      <header>PropertyZone</header>
      <div className="container">
        {data.map((item) => (
          <PropertyCard key={item._id} property={item} />
        ))}
      </div>
      <footer>Aryan Dwivedi</footer>
    </>
  );
}

export default App;
