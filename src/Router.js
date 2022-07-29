import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BlockInsert from "./BlockInsert/BlockInsert";
import BlockView from "./BlockView/BlockView";
import KendoTable from "./BlockInsert/KendoTable";
import TotalLayOut from "./BlockInsert/TotalLayOut";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:id" element={<TotalLayOut />} />
        <Route path="/blockView/:id" element={<BlockView />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
