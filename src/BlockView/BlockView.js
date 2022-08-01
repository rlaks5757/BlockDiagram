import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import { ReactDiagram, ReactOverview } from "gojs-react";
import moment from "moment";
import Url from "../url/fetchURL";
import "./BlockView.scss";

import axios from "axios";

const BlockView = () => {
  const params = useParams();

  const [loadModelData, setLoadModelData] = useState(false);

  const [modelData, setModalDate] = useState({
    class: "GraphLinksModel",
    nodeDataArray: [],
    linkDataArray: [],
  });

  const diagramRef = useRef();

  const initDiagram = () => {
    const $ = go.GraphObject.make;

    const myDiagram = $(go.Diagram, {
      "undoManager.isEnabled": true, // enable undo & redo
      initialDocumentSpot: go.Spot.Top,
      initialViewportSpot: go.Spot.Top,
      initialAutoScale: go.Diagram.Uniform,
      model: new go.GraphLinksModel({
        linkKeyProperty: "key", // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      }),

      LinkDrawn: showLinkLabel, // this DiagramEvent listener is defined below
      LinkRelinked: showLinkLabel,
    });

    myDiagram.addDiagramListener("Modified", (e) => {
      var button = document.getElementById("SaveButton");
      if (button) button.disabled = !myDiagram.isModified;
      var idx = document.title.indexOf("*");
      if (myDiagram.isModified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.slice(0, idx);
      }
    });

    function nodeStyle() {
      return [
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
          go.Point.stringify
        ),
        {
          // the Node.location is at the center of each node
          locationSpot: go.Spot.Center,
        },
      ];
    }

    function makePort(name, align, spot, output, input) {
      var horizontal =
        align.equals(go.Spot.Top) || align.equals(go.Spot.Bottom);
      // the port is basically just a transparent rectangle that stretches along the side of the node,
      // and becomes colored when the mouse passes over it
      return $(go.Shape, {
        fill: "transparent", // changed to a color in the mouseEnter event handler
        strokeWidth: 0, // no stroke
        width: horizontal ? NaN : 8, // if not stretching horizontally, just 8 wide
        height: !horizontal ? NaN : 8, // if not stretching vertically, just 8 tall
        alignment: align, // align the port on the main Shape
        stretch: horizontal
          ? go.GraphObject.Horizontal
          : go.GraphObject.Vertical,
        portId: name, // declare this object to be a "port"
        fromSpot: spot, // declare where links may connect at this port
        fromLinkable: output, // declare whether the user may draw links from here
        toSpot: spot, // declare where links may connect at this port
        toLinkable: input, // declare whether the user may draw links to here
        cursor: "pointer", // show a different cursor to indicate potential link point
        mouseEnter: (e, port) => {
          // the PORT argument will be this Shape
          if (!e.diagram.isReadOnly) port.fill = "rgba(255,0,255,0.5)";
        },
        mouseLeave: (e, port) => (port.fill = "transparent"),
      });
    }

    var mainItemFill = "#F8BBD0";

    var normalItemFill = "white";

    var steamItemFill = "#B3E5FC";

    const clickEvent = function (e, node) {
      // highlight all Links and Nodes coming out of a given Node

      var diagram = node.diagram;

      diagram.startTransaction("highlight");
      // remove any previous highlighting
      diagram.clearHighlighteds();
      // for each Link coming out of the Node, set Link.isHighlighted
      node.findLinksOutOf().each(function (l) {
        l.isSelected = true;
      });
      node.findLinksInto().each(function (l) {
        l.isSelected = true;
      });
      // for each Node destination for the Node, set Node.isHighlighted
      node.findNodesOutOf().each(function (n) {
        n.isHighlighted = true;
      });
      node.findNodesInto().each(function (n) {
        n.isHighlighted = true;
      });
      diagram.commitTransaction("highlight");
      handleNodeClick(node.data);
    };

    const linkClickEvent = (e, node) => {
      myDiagram.commandHandler.doKeyDown = function () {
        var ekey = myDiagram.lastInput;

        if (ekey.key === "Backspace") {
          e.diagram.commandHandler.deleteSelection();
        }
      };
    };

    var defaultAdornment = $(
      go.Adornment,
      "Spot",
      $(
        go.Panel,
        "Auto",
        $(go.Shape, { fill: null, stroke: "dodgerblue", strokeWidth: 4 }),
        $(go.Placeholder)
      ),
      // the button to create a "next" node, at the top-right corner
      $(
        "Button",
        {
          alignment: go.Spot.TopRight,
        }, // this function is defined below
        new go.Binding("visible", "", (a) => !a.diagram.isReadOnly).ofObject(),
        $(go.Shape, "PlusLine", { desiredSize: new go.Size(6, 6) })
      )
    );

    myDiagram.nodeTemplateMap.add(
      "High", // the default category
      $(
        go.Node,
        "Vertical",
        { selectionAdornmentTemplate: defaultAdornment },
        go.Panel.Auto,
        nodeStyle(),
        { click: clickEvent },
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape

        $(
          go.Shape,
          "RoundedRectangle",
          {
            fill: mainItemFill,
          },
          new go.Binding("stroke", "isHighlighted", function (h) {
            return h ? "green" : "black";
          }).ofObject(),
          new go.Binding("strokeWidth", "isHighlighted", function (h) {
            return h ? 4 : 2;
          }).ofObject()
        ),
        new go.Binding("figure", "figure"),
        $(
          go.Panel,
          "Table",
          $(go.RowColumnDefinition, {
            row: 0,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 1,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 2,
            separatorStroke: "black",
            coversSeparators: true,
          }),

          $(go.RowColumnDefinition, {
            row: 2,
            column: 1,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 4,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 5,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 0,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 1,
            separatorStroke: "black",

            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 2,
            separatorStroke: "black",
            coversSeparators: true,
          }),

          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActivityName").makeTwoWay(),
            {
              editable: false,
              row: 0,
              column: 0,
              columnSpan: 3,
              margin: 5,
              width: 125,
              height: 75,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 13px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "planDate").makeTwoWay(), {
            editable: false,

            row: 1,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 2,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 3,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6PlannedDuration").makeTwoWay(),
            {
              editable: false,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: false,
            row: 4,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 5,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 6,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActualDuration").makeTwoWay(),
            {
              editable: false,
              row: 5,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          )
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, go.Spot.TopSide, true, true),
        makePort("L", go.Spot.Left, go.Spot.LeftSide, true, true),
        makePort("R", go.Spot.Right, go.Spot.RightSide, true, true),
        makePort("B", go.Spot.Bottom, go.Spot.BottomSide, true, true)
      )
    );

    myDiagram.nodeTemplateMap.add(
      "Medium", // the default category
      $(
        go.Node,
        go.Panel.Auto,
        nodeStyle(),
        { click: clickEvent },
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape

        $(
          go.Shape,
          "RoundedRectangle",
          {
            fill: steamItemFill,
            stroke: "black",
            strokeWidth: 2,
          },
          new go.Binding("stroke", "isHighlighted", function (h) {
            return h ? "green" : "black";
          }).ofObject(),
          new go.Binding("strokeWidth", "isHighlighted", function (h) {
            return h ? 4 : 2;
          }).ofObject()
        ),
        new go.Binding("figure", "figure"),

        $(
          go.Panel,
          "Table",
          $(go.RowColumnDefinition, {
            row: 0,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 1,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 2,
            separatorStroke: "black",
            coversSeparators: true,
          }),

          $(go.RowColumnDefinition, {
            row: 2,
            column: 1,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 4,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 5,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 0,
            separatorStroke: "black",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 1,
            separatorStroke: "black",

            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            column: 2,
            separatorStroke: "black",
            coversSeparators: true,
          }),

          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActivityName").makeTwoWay(),
            {
              editable: false,

              row: 0,
              column: 0,
              columnSpan: 3,
              margin: 5,
              width: 125,
              height: 75,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 13px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "planDate").makeTwoWay(), {
            editable: false,

            row: 1,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 2,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 3,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6PlannedDuration").makeTwoWay(),
            {
              editable: false,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: false,
            row: 4,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 5,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 6,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActualDuration").makeTwoWay(),
            {
              editable: false,
              row: 5,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          )
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, go.Spot.TopSide, true, true),
        makePort("L", go.Spot.Left, go.Spot.LeftSide, true, true),
        makePort("R", go.Spot.Right, go.Spot.RightSide, true, true),
        makePort("B", go.Spot.Bottom, go.Spot.BottomSide, true, true)
      )
    );

    myDiagram.nodeTemplateMap.add(
      "Low", // the default category
      $(
        go.Node,
        go.Panel.Auto,
        nodeStyle(),
        { click: clickEvent },
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape

        $(
          go.Shape,
          "RoundedRectangle",
          {
            fill: normalItemFill,
            stroke: "black",
            strokeWidth: 2,
          },
          new go.Binding("stroke", "isHighlighted", function (h) {
            return h ? "green" : "black";
          }).ofObject(),
          new go.Binding("strokeWidth", "isHighlighted", function (h) {
            return h ? 4 : 2;
          }).ofObject()
        ),
        new go.Binding("figure", "figure"),

        $(
          go.Panel,
          "Table",
          $(go.RowColumnDefinition, {
            row: 0,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 1,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, { row: 2, separatorStroke: "black" }),
          $(go.RowColumnDefinition, {
            row: 2,
            column: 1,
            separatorStroke: "black",
            coversSeparators: false,
          }),
          $(go.RowColumnDefinition, {
            row: 4,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, { row: 5, separatorStroke: "black" }),

          $(go.RowColumnDefinition, { column: 0, separatorStroke: "black" }),
          $(go.RowColumnDefinition, { column: 1, separatorStroke: "black" }),
          $(go.RowColumnDefinition, {
            column: 2,
            separatorStroke: "black",
          }),

          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActivityName").makeTwoWay(),
            {
              editable: false,
              row: 0,
              column: 0,
              columnSpan: 3,
              margin: 5,
              width: 125,
              height: 75,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 13px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "planDate").makeTwoWay(), {
            editable: false,
            row: 1,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 2,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 3,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6PlannedDuration").makeTwoWay(),
            {
              editable: false,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: false,
            row: 4,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 5,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_finish").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 6,
              column: 0,
              columnSpan: 1,
              width: 100,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActualDuration").makeTwoWay(),
            {
              editable: false,
              row: 5,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          )
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, go.Spot.TopSide, true, true),
        makePort("L", go.Spot.Left, go.Spot.LeftSide, true, true),
        makePort("R", go.Spot.Right, go.Spot.RightSide, true, true),
        makePort("B", go.Spot.Bottom, go.Spot.BottomSide, true, true)
      )
    );

    myDiagram.nodeTemplateMap.add(
      "Top", // the default category
      $(
        go.Node,
        go.Panel.Auto,
        nodeStyle(),
        { click: clickEvent },
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape

        $(
          go.Shape,
          "RoundedRectangle",
          {
            fill: normalItemFill,
            stroke: "black",
            strokeWidth: 2,
          },
          new go.Binding("stroke", "isHighlighted", function (h) {
            return h ? "green" : "black";
          }).ofObject(),
          new go.Binding("strokeWidth", "isHighlighted", function (h) {
            return h ? 4 : 2;
          }).ofObject()
        ),
        new go.Binding("figure", "figure"),

        $(
          go.Panel,
          "Table",
          $(go.RowColumnDefinition, {
            row: 0,
            background: "white",
          }),
          $(go.RowColumnDefinition, {
            row: 1,
            background: "white",
          }),
          $(go.RowColumnDefinition, {
            row: 2,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, { row: 3, separatorStroke: "black" }),
          $(go.RowColumnDefinition, {
            row: 4,
            column: 1,
            separatorStroke: "black",
            coversSeparators: false,
          }),
          $(go.RowColumnDefinition, {
            row: 5,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, { row: 6, separatorStroke: "black" }),
          $(go.TextBlock, new go.Binding("text", "key").makeTwoWay(), {
            row: 0,
            column: 0,
            columnSpan: 3,
            margin: 5,
            width: 125,
            verticalAlignment: go.Spot.Left,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),

          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActivityName").makeTwoWay(),
            {
              editable: false,
              row: 1,
              column: 0,
              columnSpan: 3,
              margin: 5,
              width: 125,
              height: 75,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 13px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "planDate").makeTwoWay(), {
            editable: false,
            row: 2,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 3,
              column: 0,
              columnSpan: 3,
              margin: 5,
              textAlign: "center",
            }
          ),

          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: false,
            row: 4,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_start").makeTwoWay(),
            {
              editable: false,
              textEditor: window.TextEditor,
              row: 6,
              column: 0,
              columnSpan: 3,
              margin: 5,
              textAlign: "center",
            }
          )
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, go.Spot.TopSide, true, true),
        makePort("L", go.Spot.Left, go.Spot.LeftSide, true, true),
        makePort("R", go.Spot.Right, go.Spot.RightSide, true, true),
        makePort("B", go.Spot.Bottom, go.Spot.BottomSide, true, true)
      )
    );

    // taken from ../extensions/Figures.js:
    go.Shape.defineFigureGenerator("File", (shape, w, h) => {
      var geo = new go.Geometry();
      var fig = new go.PathFigure(0, 0, true); // starting point
      geo.add(fig);
      fig.add(new go.PathSegment(go.PathSegment.Line, 0.75 * w, 0));
      fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.25 * h));
      fig.add(new go.PathSegment(go.PathSegment.Line, w, h));
      fig.add(new go.PathSegment(go.PathSegment.Line, 0, h).close());
      var fig2 = new go.PathFigure(0.75 * w, 0, false);
      geo.add(fig2);
      // The Fold
      fig2.add(new go.PathSegment(go.PathSegment.Line, 0.75 * w, 0.25 * h));
      fig2.add(new go.PathSegment(go.PathSegment.Line, w, 0.25 * h));
      geo.spot1 = new go.Spot(0, 0.25);
      geo.spot2 = go.Spot.BottomRight;
      return geo;
    });

    myDiagram.linkTemplate = $(
      go.Link, // the whole link panel
      { click: linkClickEvent },
      {
        routing: go.Link.AvoidsNodes,
        curve: go.Link.JumpOver,
        corner: 5,
        toShortLength: 4,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
        // mouse-overs subtly highlight links:
        mouseEnter: (e, link) =>
          (link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"),
        mouseLeave: (e, link) =>
          (link.findObject("HIGHLIGHT").stroke = "transparent"),
        selectionAdorned: false,
      },
      new go.Binding("points").makeTwoWay(),
      $(
        go.Shape, // the highlight shape, normally transparent
        {
          isPanelMain: true,
          strokeWidth: 8,
          stroke: "transparent",
          name: "HIGHLIGHT",
        }
      ),
      $(
        go.Shape, // the link path shape
        { isPanelMain: true, stroke: "gray", strokeWidth: 2 },
        new go.Binding("stroke", "isSelected", (sel) =>
          sel ? "dodgerblue" : "gray"
        ).ofObject(),
        new go.Binding("strokeWidth", "isSelected", function (h) {
          return h ? 3 : 2;
        }).ofObject()
      ),

      $(
        go.Shape, // the arrowhead
        { toArrow: "standard", strokeWidth: 0, fill: "gray" }
      ),
      $(
        go.Panel,
        "Auto", // the link label, normally not visible
        {
          visible: false,
          name: "LABEL",
          segmentIndex: 2,
          segmentFraction: 0.5,
        },
        new go.Binding("visible", "visible").makeTwoWay(),
        $(
          go.Shape,
          "RoundedRectangle", // the label shape
          { fill: "#F8F8F8", strokeWidth: 0 }
        ),
        $(
          go.TextBlock,
          "Yes", // the label
          {
            textAlign: "center",
            font: "10pt helvetica, arial, sans-serif",
            stroke: "#333333",
            editable: false,
          },
          new go.Binding("text").makeTwoWay()
        )
      )
    );

    function showLinkLabel(e) {
      var label = e.subject.findObject("LABEL");
      if (label !== null)
        label.visible = e.subject.fromNode.data.category === "Conditional";
    }

    myDiagram.toolManager.linkingTool.temporaryLink.routing =
      go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing =
      go.Link.Orthogonal;

    return myDiagram;
  };

  function initOverview() {
    const $ = go.GraphObject.make;
    const overview = $(go.Overview, {
      observed: diagramRef.current?.getDiagram(),
      contentAlignment: go.Spot.Center,
    });
    return overview;
  }

  const commissionFetch = async () => {
    try {
      const baseSet = {
        class: "GraphLinksModel",
        nodeDataArray: [],
        linkDataArray: [],
      };

      const diagram = await diagramRef.current?.getDiagram();

      const fetchData = await axios.get(`${Url}/blockInfo/${params.id}`);

      const comData = await fetchData.data.com;

      // const topFetchData = await axios.get("/data/top.json");
      // const topData = await topFetchData.data.data;
      const topData = await fetchData.data.top;

      await comData.forEach((com) => {
        if (com.status !== "Deleted") {
          if (com.dtsDashCoordinates !== null) {
            baseSet.nodeDataArray.push({
              key: com.uuu_P6ActivityId,
              category: com.dtsPrioritySPD,
              uuu_P6ActivityName: com.uuu_P6ActivityName,
              planDate: "Plan Date",
              ddd_evm_plan_start: moment(com.ddd_evm_plan_start).format(
                "MM-DD-YYYY"
              ),
              ddd_evm_plan_finish: moment(com.ddd_evm_plan_finish).format(
                "MM-DD-YYYY"
              ),
              uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
              actualDate: "Actual Date",
              ddd_evm_actual_start:
                moment(com.ddd_evm_actual_start).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.ddd_evm_actual_start).format("MM-DD-YYYY")
                  : null,
              ddd_evm_actual_finish:
                moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY")
                  : null,
              uuu_P6ActualDuration: com.uuu_P6ActualDuration,
              loc: com.dtsDashCoordinates,
              record_no: com.record_no,
            });
          } else {
            baseSet.nodeDataArray.push({
              key: com.uuu_P6ActivityId,
              category: com.dtsPrioritySPD,
              uuu_P6ActivityName: com.uuu_P6ActivityName,
              planDate: "Plan Date",
              ddd_evm_plan_start: moment(com.ddd_evm_plan_start).format(
                "MM-DD-YYYY"
              ),
              ddd_evm_plan_finish: moment(com.ddd_evm_plan_finish).format(
                "MM-DD-YYYY"
              ),
              uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
              actualDate: "Actual Date",
              ddd_evm_actual_start:
                moment(com.ddd_evm_actual_start).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.ddd_evm_actual_start).format("MM-DD-YYYY")
                  : null,
              ddd_evm_actual_finish:
                moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY")
                  : null,
              uuu_P6ActualDuration: com.uuu_P6ActualDuration,

              record_no: com.record_no,
            });
          }
        }
      });

      await comData.forEach((com) => {
        if (com.status !== "Deleted") {
          if (com._bp_lineitems !== undefined) {
            if (com._bp_lineitems.length > 0) {
              com._bp_lineitems.forEach((com2) => {
                baseSet.linkDataArray.push({
                  from: com.uuu_P6ActivityId,
                  to: com2.dtsCommActivityBPK,
                  points: com2.dtsDashCoordinates
                    .split(",")
                    .map((com) => Number(com)),
                  dtsLineAutoSeq: com2.dtsLineAutoSeq,
                });
              });
            }
          }
        }
      });

      await topData.forEach((com) => {
        if (com.status !== "Deleted") {
          if (com.dtsDashCoordinates !== null) {
            baseSet.nodeDataArray.push({
              key: com.dtsTOPCode,
              category: "Top",
              uuu_P6ActivityName: com.dtsTOPTitle,
              planDate: "Plan Date",
              ddd_evm_plan_start: moment(com.dtsPlanHODate).format(
                "MM-DD-YYYY"
              ),
              actualDate: "Actual Date",
              ddd_evm_actual_start:
                moment(com.dtsActualHODate).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.dtsActualHODate).format("MM-DD-YYYY")
                  : null,
              loc: com.dtsDashCoordinates,
              record_no: com.record_no,
            });
          } else {
            baseSet.nodeDataArray.push({
              key: com.dtsTOPCode,
              category: "Top",
              uuu_P6ActivityName: com.dtsTOPTitle,
              planDate: "Plan Date",
              ddd_evm_plan_start: moment(com.dtsPlanHODate).format(
                "MM-DD-YYYY"
              ),
              actualDate: "Actual Date",
              ddd_evm_actual_start:
                moment(com.dtsActualHODate).format("MM-DD-YYYY") !==
                "Invalid date"
                  ? moment(com.dtsActualHODate).format("MM-DD-YYYY")
                  : null,
              record_no: com.record_no,
            });
          }
        }
      });

      await topData.forEach((com) => {
        if (com.status !== "Deleted") {
          if (com._bp_lineitems !== undefined) {
            com._bp_lineitems.forEach((com2) => {
              baseSet.linkDataArray.push({
                from: com.dtsTOPCode,
                to: com2.uuu_P6ActivityId,
                points: com2.dtsDashCoordinates
                  .split(",")
                  .map((com) => Number(com)),
                dtsLineAutoSeq: com2.dtsLineAutoSeq,
              });
            });
          }
        }
      });

      setModalDate(baseSet);

      // setTopOriginalData(topID);
      diagram.model = go.Model.fromJson(JSON.stringify(baseSet));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setLoadModelData(true);
  }, []);

  useEffect(() => {
    commissionFetch();
  }, [params]);

  const handleNodeClick = async (nodeData) => {
    const baseSet = {
      class: "GraphLinksModel",
      nodeDataArray: [],
      linkDataArray: [],
    };

    const fetchData = await axios.get(`${Url}/blockInfo/${params.id}`);

    const comData = await fetchData.data.com;

    // const topFetchData = await axios.get("/data/top.json");
    // const topData = await topFetchData.data.data;
    const topData = await fetchData.data.top;

    await comData.forEach((com) => {
      if (com.status !== "Deleted") {
        if (com.dtsDashCoordinates !== null) {
          baseSet.nodeDataArray.push({
            key: com.uuu_P6ActivityId,
            category: com.dtsPrioritySPD,
            uuu_P6ActivityName: com.uuu_P6ActivityName,
            planDate: "Plan Date",
            ddd_evm_plan_start: moment(com.ddd_evm_plan_start).format(
              "MM-DD-YYYY"
            ),
            ddd_evm_plan_finish: moment(com.ddd_evm_plan_finish).format(
              "MM-DD-YYYY"
            ),
            uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
            actualDate: "Actual Date",
            ddd_evm_actual_start:
              moment(com.ddd_evm_actual_start).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.ddd_evm_actual_start).format("MM-DD-YYYY")
                : null,
            ddd_evm_actual_finish:
              moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY")
                : null,
            uuu_P6ActualDuration: com.uuu_P6ActualDuration,
            loc: com.dtsDashCoordinates,
            record_no: com.record_no,
          });
        } else {
          baseSet.nodeDataArray.push({
            key: com.uuu_P6ActivityId,
            category: com.dtsPrioritySPD,
            uuu_P6ActivityName: com.uuu_P6ActivityName,
            planDate: "Plan Date",
            ddd_evm_plan_start: moment(com.ddd_evm_plan_start).format(
              "MM-DD-YYYY"
            ),
            ddd_evm_plan_finish: moment(com.ddd_evm_plan_finish).format(
              "MM-DD-YYYY"
            ),
            uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
            actualDate: "Actual Date",
            ddd_evm_actual_start:
              moment(com.ddd_evm_actual_start).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.ddd_evm_actual_start).format("MM-DD-YYYY")
                : null,
            ddd_evm_actual_finish:
              moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.ddd_evm_actual_finish).format("MM-DD-YYYY")
                : null,
            uuu_P6ActualDuration: com.uuu_P6ActualDuration,

            record_no: com.record_no,
          });
        }
      }
    });

    await comData.forEach((com) => {
      if (com.status !== "Deleted") {
        if (com._bp_lineitems !== undefined) {
          if (com._bp_lineitems.length > 0) {
            com._bp_lineitems.forEach((com2) => {
              baseSet.linkDataArray.push({
                from: com.uuu_P6ActivityId,
                to: com2.dtsCommActivityBPK,
                points: com2.dtsDashCoordinates
                  .split(",")
                  .map((com) => Number(com)),
                dtsLineAutoSeq: com2.dtsLineAutoSeq,
              });
            });
          }
        }
      }
    });

    await topData.forEach((com) => {
      if (com.status !== "Deleted") {
        if (com.dtsDashCoordinates !== null) {
          baseSet.nodeDataArray.push({
            key: com.dtsTOPCode,
            category: "Top",
            uuu_P6ActivityName: com.dtsTOPTitle,
            planDate: "Plan Date",
            ddd_evm_plan_start: moment(com.dtsPlanHODate).format("MM-DD-YYYY"),
            actualDate: "Actual Date",
            ddd_evm_actual_start:
              moment(com.dtsActualHODate).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.dtsActualHODate).format("MM-DD-YYYY")
                : null,
            loc: com.dtsDashCoordinates,
            record_no: com.record_no,
          });
        } else {
          baseSet.nodeDataArray.push({
            key: com.dtsTOPCode,
            category: "Top",
            uuu_P6ActivityName: com.dtsTOPTitle,
            planDate: "Plan Date",
            ddd_evm_plan_start: moment(com.dtsPlanHODate).format("MM-DD-YYYY"),
            actualDate: "Actual Date",
            ddd_evm_actual_start:
              moment(com.dtsActualHODate).format("MM-DD-YYYY") !==
              "Invalid date"
                ? moment(com.dtsActualHODate).format("MM-DD-YYYY")
                : null,
            record_no: com.record_no,
          });
        }
      }
    });

    await topData.forEach((com) => {
      if (com.status !== "Deleted") {
        if (com._bp_lineitems !== undefined) {
          com._bp_lineitems.forEach((com2) => {
            baseSet.linkDataArray.push({
              from: com.dtsTOPCode,
              to: com2.uuu_P6ActivityId,
              points: com2.dtsDashCoordinates
                .split(",")
                .map((com) => Number(com)),
              dtsLineAutoSeq: com2.dtsLineAutoSeq,
            });
          });
        }
      }
    });

    const diagram = diagramRef.current?.getDiagram();

    const nowDiagramData = JSON.parse(diagram.model.toJson());

    const successorLink = baseSet.linkDataArray.filter(
      (com) => com.from === nodeData.key
    );

    const predecessorLink = baseSet.linkDataArray.filter(
      (com) => com.to === nodeData.key
    );

    const nodeItem = [];
    const linkItem = successorLink.concat(predecessorLink);

    successorLink.forEach((com) => {
      baseSet.nodeDataArray.forEach((com2) => {
        if (com.to === com2.key) {
          nodeItem.push(com2);
        }
      });
    });

    predecessorLink.forEach((com) => {
      baseSet.nodeDataArray.forEach((com2) => {
        if (com.from === com2.key) {
          nodeItem.push(com2);
        }
      });
    });

    const finalNode = nodeItem.filter(
      (x) =>
        !JSON.stringify(nowDiagramData.nodeDataArray).includes(
          JSON.stringify(x)
        )
    );

    const finalLink = linkItem.filter(
      (x) =>
        !JSON.stringify(nowDiagramData.linkDataArray).includes(
          JSON.stringify(x)
        )
    );

    nowDiagramData.nodeDataArray =
      nowDiagramData.nodeDataArray.concat(finalNode);

    const linkData = nowDiagramData.linkDataArray.concat(finalLink);

    const finalLinkData = linkData.filter((item, i) => {
      return (
        linkData.findIndex((item2, j) => {
          return item.to === item2.to && item.from === item2.from;
        }) === i
      );
    });

    nowDiagramData.linkDataArray = finalLinkData;

    if (
      finalNode.length > 0 ||
      finalLinkData.length !== nowDiagramData.linkDataArray.length
    ) {
      diagram.model = go.Model.fromJson(JSON.stringify(nowDiagramData));
    }
  };

  const filterNodeData = (cate) => {
    const diagram = diagramRef.current?.getDiagram();

    if (cate === "reset") {
      diagram.model = go.Model.fromJson(JSON.stringify(modelData));
    } else {
      let filteringModel = { ...modelData };
      const filterNodeDataArray = modelData.nodeDataArray.filter((com) => {
        return com.category === cate;
      });

      filteringModel.nodeDataArray = filterNodeDataArray;

      const linkFilterArray = modelData.nodeDataArray.filter((com) => {
        return com.category !== cate;
      });

      const test0 = linkFilterArray.map((com) => com.key);

      const test1 = modelData.linkDataArray.filter((com) => {
        return test0.some((com2) => {
          return com.to === com2;
        });
      });

      const test2 = modelData.linkDataArray.filter((com) => {
        return test0.some((com2) => {
          return com.from === com2;
        });
      });

      const totalTest = [];

      test1.map((com) => {
        return totalTest.push(com);
      });

      test2.map((com) => {
        return totalTest.push(com);
      });

      const totalTestResult = [...new Set(totalTest)];

      const linkDataArrayResult = [...modelData.linkDataArray].filter(
        (com) => !totalTestResult.includes(com)
      );

      filteringModel.linkDataArray = linkDataArrayResult;

      diagram.model = go.Model.fromJson(JSON.stringify(filteringModel));
    }
  };

  return (
    <>
      <div className="blockInsert">
        <ReactDiagram
          ref={diagramRef}
          initDiagram={initDiagram}
          divClassName="diagram-component"
        />
        <ReactOverview
          initOverview={initOverview}
          divClassName="overview-component"
          observedDiagram={
            (loadModelData && diagramRef.current?.getDiagram()) || null
          }
        />

        <div className="controlButtonBox">
          <button
            onClick={() => {
              filterNodeData("High");
            }}
          >
            High
          </button>
          <button
            onClick={() => {
              filterNodeData("Medium");
            }}
          >
            Medium
          </button>
          <button
            onClick={() => {
              filterNodeData("Low");
            }}
          >
            Low
          </button>
          <button
            onClick={() => {
              filterNodeData("Top");
            }}
          >
            TOP
          </button>
          <button
            onClick={() => {
              filterNodeData("reset");
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
};

export default BlockView;

// <button id="SaveButton" className="saveButton" onClick={save}>
//           Save
//         </button>
//         <button className="loadButton" onClick={load}>
//           Load
//         </button>
//         <button id="FirstButton" name="first" onClick={filtering}>
//           First
//         </button>
//         <button id="SecondButton" name="second" onClick={filtering}>
//           Second
//         </button>
//         <button id="ThirdButton" name="third" onClick={filtering}>
//           Third
//         </button>
//         <button id="ResetButton" name="reset" onClick={filtering}>
//           Reset
//         </button>

// const [modelData, setModalDate] = useState({
//   class: "GraphLinksModel",
//   nodeDataArray: [],
//   linkDataArray: [],
// });

// const save = () => {
//   const diagram = diagramRef.current?.getDiagram();

//   setModalDate({
//     ...modelData,
//     nodeDataArray: JSON.parse(diagram.model.toJson()).nodeDataArray,
//     linkDataArray: JSON.parse(diagram.model.toJson()).linkDataArray,
//   });
//   diagram.isModified = false;

//   console.log(JSON.parse(diagram.model.toJson()));
// };

// const load = () => {
//   const diagram = diagramRef.current?.getDiagram();
//   diagram.model = go.Model.fromJson(JSON.stringify(modelData));
// };

// const filtering = (e) => {
//   const diagram = diagramRef.current?.getDiagram();

//   if (e.target.name === "reset") {
//     diagram.model = go.Model.fromJson(JSON.stringify(modelData));
//   } else {
//     let filteringModel = { ...modelData };
//     const filterNodeDataArray = modelData.nodeDataArray.filter((com) => {
//       return com.category === e.target.name;
//     });

//     filteringModel.nodeDataArray = filterNodeDataArray;

//     const linkFilterArray = modelData.nodeDataArray.filter((com) => {
//       return com.category !== e.target.name;
//     });

//     const test0 = linkFilterArray.map((com) => com.key);

//     const test1 = modelData.linkDataArray.filter((com) => {
//       return test0.some((com2) => {
//         return com.to === com2;
//       });
//     });

//     const test2 = modelData.linkDataArray.filter((com) => {
//       return test0.some((com2) => {
//         return com.from === com2;
//       });
//     });

//     const totalTest = [];

//     test1.map((com) => {
//       return totalTest.push(com);
//     });

//     test2.map((com) => {
//       return totalTest.push(com);
//     });

//     const totalTestResult = [...new Set(totalTest)];

//     const linkDataArrayResult = [...modelData.linkDataArray].filter(
//       (com) => !totalTestResult.includes(com)
//     );

//     filteringModel.linkDataArray = linkDataArrayResult;

//     diagram.model = go.Model.fromJson(JSON.stringify(filteringModel));
//   }
// };
