import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BlockInsert from "./BlockInsert/BlockInsert";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlockInsert />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
