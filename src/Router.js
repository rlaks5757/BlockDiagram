import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BlockInsert from "./BlockInsert/BlockInsert";
import BlockView from "./BlockView/BlockView";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:id" element={<BlockInsert />} />
        <Route path="/blockView/:id" element={<BlockView />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
