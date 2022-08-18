import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TotalLayOut from "./TotalLayOut/TotalLayOut";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:id" element={<TotalLayOut />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
