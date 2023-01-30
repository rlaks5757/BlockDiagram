import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TotalLayOut from "./TotalLayOut/TotalLayOut";
import BlockInsert from "./BlockInsert/BlockInsert";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:project_code" element={<TotalLayOut />} />
        <Route path="/:project_code/insert" element={<BlockInsert />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
