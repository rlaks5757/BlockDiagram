import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import { ReactDiagram, ReactOverview } from "gojs-react";
import moment from "moment";
import "./BlockInsert.scss";
import ComCardInsert from "./ComCardInsert/ComCardInsert";
import TopCardInsert from "./ComCardInsert/TopCardInsert";
import axios from "axios";

const BlockInsert = () => {
  const params = useParams();
  const [comOriginalData, setComOriginalData] = useState([]);
  const [topOriginalData, setTopOriginalData] = useState([]);

  const [insertDataToggle, setInsertDataToogle] = useState(true);

  const [insertData, setInsertData] = useState(baseInsertComData);

  const [insertTopData, setInsertTopData] = useState(baseInsertTopData);

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
              editable: true,

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
            editable: true,

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
              editable: true,

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
              editable: true,

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
              editable: true,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: true,
            row: 4,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 13px sans-serif",
          }),
          $(go.TextBlock, new go.Binding("text", "actualDateS").makeTwoWay(), {
            editable: true,
            row: 5,
            column: 0,
            columnSpan: 1,
            width: 100,
            margin: 5,
            textAlign: "center",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_finish").makeTwoWay(),
            {
              editable: true,
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
              editable: true,
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
              editable: true,

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
            editable: true,

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
              editable: true,

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
              editable: true,
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
              editable: true,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: true,
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
              editable: true,
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
              editable: true,
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
              editable: true,
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
              editable: true,
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
            editable: true,
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
              editable: true,
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
              editable: true,
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
              editable: true,
              row: 2,
              rowSpan: 2,
              column: 2,
              width: 25,
              margin: 5,
              textAlign: "center",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: true,
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
              editable: true,
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
              editable: true,
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
              editable: true,
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
            editable: true,
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
              editable: true,
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
            editable: true,
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
              editable: true,
              row: 3,
              column: 0,
              columnSpan: 3,
              margin: 5,
              textAlign: "center",
            }
          ),

          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: true,
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
              editable: true,
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
            editable: true,
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
  const [loadModelData, setLoadModelData] = useState(false);

  useEffect(() => {
    setLoadModelData(true);
  }, []);

  useEffect(() => {
    const commissionFetch = async () => {
      try {
        const baseSet = {
          class: "GraphLinksModel",
          nodeDataArray: [],
          linkDataArray: [],
        };

        const diagram = await diagramRef.current?.getDiagram();

        const fetchData = await axios.get(
          `http://localhost:8000/blockInfo/${params.id}`
        );

        const comData = await fetchData.data.com;

        await setComOriginalData(comData);

        // const topFetchData = await axios.get("/data/top.json");
        // const topData = await topFetchData.data.data;
        const topData = await fetchData.data.top;

        await setTopOriginalData(topData);

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
                  dtsLineAutoSeq: com2.dtsLineAutoSeq,
                });
              });
            }
          }
        });

        diagram.model = go.Model.fromJson(JSON.stringify(baseSet));
      } catch (err) {
        console.log(err);
      }
    };

    commissionFetch();
  }, [params]);

  const handleInsertData = (e) => {
    const { value, name } = e.target;

    if (name === "uuu_P6ActivityName") {
      setInsertData((prev) => {
        return {
          ...prev,
          [name]: value,
        };
      });
    } else if (name === "key") {
      setInsertData((prev) => {
        return {
          ...prev,
          key: value.toUpperCase(),
        };
      });
    } else if (name === "category") {
      if (value === "Turn-Over Package") {
        setInsertDataToogle(false);
        setInsertTopData((prev) => {
          return {
            ...prev,
            [name]: "Top",
          };
        });
      } else {
        setInsertDataToogle(true);
        setInsertData((prev) => {
          return {
            ...prev,
            [name]: value.split(" ")[1],
          };
        });
      }
    } else {
      setInsertData((prev) => {
        return {
          ...prev,
          [name]: moment(new Date(value)).format("MM-DD-YYYY"),
        };
      });
    }
  };

  const handleInsertTopData = (e) => {
    const { value, name } = e.target;

    if (name === "uuu_P6ActivityName") {
      setInsertTopData((prev) => {
        return {
          ...prev,
          [name]: value,
        };
      });
    } else if (name === "key") {
      setInsertTopData((prev) => {
        return {
          ...prev,
          key: value.toUpperCase(),
        };
      });
    } else {
      setInsertTopData((prev) => {
        return {
          ...prev,
          [name]: moment(new Date(value)).format("MM-DD-YYYY"),
        };
      });
    }
  };

  const InsertBlockData = () => {
    const diagram = diagramRef.current?.getDiagram();

    const insertNodeData = JSON.parse(diagram.model.toJson());

    if (insertDataToggle) {
      insertNodeData.nodeDataArray.push(insertData);
      diagram.model = go.Model.fromJson(JSON.stringify(insertNodeData));
    } else {
      insertNodeData.nodeDataArray.push(insertTopData);
      diagram.model = go.Model.fromJson(JSON.stringify(insertNodeData));
    }
    setInsertData(baseInsertComData);

    setInsertTopData(baseInsertTopData);
  };

  const finalDataSave = async () => {
    const diagram = await diagramRef.current?.getDiagram();

    const insertNodeData = await JSON.parse(diagram.model.toJson());

    let comData = [];
    let topData = [];

    await insertNodeData.nodeDataArray.forEach((com) => {
      if (com.category === "Top") {
        topData.push({
          dtsTOPCode: com.key,
          dtsTOPTitle: com.uuu_P6ActivityName,
          dtsPlanHODate:
            com.ddd_evm_plan_start === null ||
            com.ddd_evm_plan_start.length === 0
              ? null
              : moment(new Date(com.ddd_evm_plan_start)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          dtsActualHODate:
            com.ddd_evm_actual_start === null ||
            com.ddd_evm_actual_start.length === 0
              ? null
              : moment(new Date(com.ddd_evm_actual_start)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          status:
            com.ddd_evm_actual_start === null ||
            com.ddd_evm_actual_start.length === 0
              ? "Not_Issued"
              : "Issued",
          dtsDashCoordinates: com.loc,
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      } else {
        comData.push({
          uuu_P6ActivityId: com.key,
          uuu_P6ActivityName: com.uuu_P6ActivityName,
          ddd_evm_plan_start:
            com.ddd_evm_plan_start === null ||
            com.ddd_evm_plan_start.length === 0
              ? null
              : moment(new Date(com.ddd_evm_plan_start)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          ddd_evm_plan_finish:
            com.ddd_evm_plan_finish === null ||
            com.ddd_evm_plan_finish.length === 0
              ? null
              : moment(new Date(com.ddd_evm_plan_finish)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
          ddd_evm_actual_start:
            com.ddd_evm_actual_start === null ||
            com.ddd_evm_actual_start.length === 0
              ? null
              : moment(new Date(com.ddd_evm_actual_start)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          ddd_evm_actual_finish:
            com.ddd_evm_actual_finish === null ||
            com.ddd_evm_actual_finish.length === 0
              ? null
              : moment(new Date(com.ddd_evm_actual_finish)).format(
                  "MM-DD-YYYY 00:00:00"
                ),
          uuu_P6ActualDuration: com.uuu_P6ActualDuration,
          status:
            (com.ddd_evm_actual_finish === null ||
              com.ddd_evm_actual_finish.length === 0) &&
            (com.ddd_evm_actual_start === null ||
              com.ddd_evm_actual_start.length === 0)
              ? "Not_Started"
              : (com.ddd_evm_actual_finish !== null ||
                  com.ddd_evm_actual_finish.length !== 0) &&
                (com.ddd_evm_actual_start !== null ||
                  com.ddd_evm_actual_start.length !== 0)
              ? "Completed"
              : com.ddd_evm_actual_start !== null ||
                (com.ddd_evm_actual_start.length !== 0 && "In_Progress"),
          dtsDashCoordinates: com.loc,
          dtsPrioritySPD: com.category,
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      }
    });

    await comData.forEach((com) => {
      insertNodeData.linkDataArray.forEach((com2) => {
        if (com.uuu_P6ActivityId === com2.from) {
          if (com2.dtsLineAutoSeq !== undefined) {
            com._bp_lineitems.push({
              dtsCommActivityBPK: com2.to,
              dtsDashCoordinates: com2.points.join(),
              uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
                (com3) => {
                  return com3.key === com2.to;
                }
              )[0]["uuu_P6ActivityName"],
              dtsLineAutoSeq: com2.dtsLineAutoSeq,
              short_desc: "1",
            });
          } else {
            com._bp_lineitems.push({
              dtsCommActivityBPK: com2.to,
              dtsDashCoordinates: com2.points.join(),
              uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
                (com3) => {
                  return com3.key === com2.to;
                }
              )[0]["uuu_P6ActivityName"],
              dtsLineAutoSeq: "99999",
              short_desc: "1",
            });
          }
        }
      });
    });

    await topData.forEach((com) => {
      insertNodeData.linkDataArray.forEach((com2) => {
        if (com.dtsTOPCode === com2.from) {
          if (com2.dtsLineAutoSeq !== undefined) {
            com._bp_lineitems.push({
              dtsCommActivityBPK: com2.to,
              dtsDashCoordinates: com2.points.join(),
              dtsLineAutoSeq: com2.dtsLineAutoSeq,
              uuu_tab_id: "Relationship",
              short_desc: "1",
            });
          } else {
            com._bp_lineitems.push({
              dtsCommActivityBPK: com2.to,
              dtsDashCoordinates: com2.points.join(),
              dtsLineAutoSeq: "99999",
              uuu_tab_id: "Relationship",
              short_desc: "1",
            });
          }
        }
      });
    });

    const noneDeleteItem = await insertNodeData.nodeDataArray.map((com) => {
      return com.key;
    });

    const comDifference = await comOriginalData.filter(
      (x) => !noneDeleteItem.includes(x.uuu_P6ActivityId)
    );

    const comDeleteitemChange = await comDifference.map((com) => {
      return { ...com, status: "Deleted" };
    });

    const topDifference = await topOriginalData.filter(
      (x) => !noneDeleteItem.includes(x.dtsTOPCode)
    );

    const topDeleteitemChange = await topDifference.map((com) => {
      return { ...com, status: "Deleted" };
    });

    const finalComData = await comData.concat(comDeleteitemChange);
    const finalTopData = await topData.concat(topDeleteitemChange);

    const fetchData = await axios.get(
      `http://localhost:8000/blockInfo/${params.id}`
    );

    const lastestComFetchData = await fetchData.data.com;
    const lastestTopFetchData = await fetchData.data.top;

    const originalComdata = [];

    lastestComFetchData.forEach((com) => {
      if (com._bp_lineitems !== undefined) {
        originalComdata.push({
          record_no: com.record_no,
          _bp_lineitems: com._bp_lineitems.map((com2) => com2.dtsLineAutoSeq),
        });
      } else {
        originalComdata.push({
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      }
    });

    const fixedComdata = [];

    lastestTopFetchData.forEach((com) => {
      if (com._bp_lineitems !== undefined) {
        fixedComdata.push({
          record_no: com.record_no,
          _bp_lineitems: com._bp_lineitems.map((com2) => com2.dtsLineAutoSeq),
        });
      } else {
        fixedComdata.push({
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      }
    });

    const originalTopdata = [];

    topOriginalData.forEach((com) => {
      if (com._bp_lineitems !== undefined) {
        originalTopdata.push({
          record_no: com.record_no,
          _bp_lineitems: com._bp_lineitems.map((com2) => com2.dtsLineAutoSeq),
        });
      } else {
        originalTopdata.push({
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      }
    });

    const fixedTopdata = [];

    finalTopData.forEach((com) => {
      if (com._bp_lineitems !== undefined) {
        fixedTopdata.push({
          record_no: com.record_no,
          _bp_lineitems: com._bp_lineitems.map((com2) => com2.dtsLineAutoSeq),
        });
      } else {
        fixedTopdata.push({
          record_no: com.record_no,
          _bp_lineitems: [],
        });
      }
    });

    //Delete Items Start
    const deleteComFinal = [];

    originalComdata.forEach((com) =>
      fixedComdata.forEach((com2) => {
        if (com.record_no === com2.record_no) {
          deleteComFinal.push({
            record_no: com.record_no,
            _bp_lineitems: com._bp_lineitems.filter(
              (x) => !com2._bp_lineitems.includes(x)
            ),
          });
        }
      })
    );

    const deleteTopFinal = [];

    originalTopdata.forEach((com) =>
      fixedTopdata.forEach((com2) => {
        if (com.record_no === com2.record_no) {
          deleteTopFinal.push({
            record_no: com.record_no,
            _bp_lineitems: com._bp_lineitems.filter(
              (x) => !com2._bp_lineitems.includes(x)
            ),
          });
        }
      })
    );
    //Delete Items Finish

    const originalComdataID = lastestComFetchData.map(
      (com) => com.uuu_P6ActivityId
    );

    const originalTopdataID = lastestTopFetchData.map((com) => com.dtsTOPCode);

    //Input Items Start

    const newComItem = finalComData.filter(
      (x) => !originalComdataID.includes(x.uuu_P6ActivityId)
    );

    const newTopItem = finalTopData.filter(
      (x) => !originalTopdataID.includes(x.dtsTOPCode)
    );
    //Input Items Finish

    //fixed Items Start
    const fixedComItem = finalComData.filter((x) =>
      originalComdataID.includes(x.uuu_P6ActivityId)
    );

    const fixedTopItem = finalTopData.filter((x) =>
      originalTopdataID.includes(x.dtsTOPCode)
    );

    //oragle request
    //Input
    // for (const inputItem of newComItem) {
    //   fetch(`http://localhost:8000/blockInfo/new/${params.id}`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       bpName: "Commissioning Activities",
    //       data: inputItem,
    //     }),
    //   })
    //     .then((res) => res.json())
    //     .then((data) => {
    //       setTestCount((prev) => prev++);
    //     });
    // }

    // for (const inputItem of newTopItem) {
    //   fetch(`http://localhost:8000/blockInfo/new/${params.id}`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ bpName: "Turnover Packages", data: inputItem }),
    //   })
    //     .then((res) => res.json())
    //     .then((data) => {
    //       setTestCount((prev) => prev++);
    //     });
    // }

    // //Delete
    // for (const deleteItem of deleteComFinal) {
    //   if (deleteItem._bp_lineitems.length > 0) {
    //     fetch(`http://localhost:8000/blockInfo/delete/${params.id}`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         record_no: deleteItem.record_no,
    //         _bp_lineitems: deleteItem._bp_lineitems.join(),
    //       }),
    //     })
    //       .then((res) => res.json())
    //       .then((data) => {
    //         setTestCount((prev) => prev++);
    //       });
    //   }
    // }
    // //Fixed
    for (const fixed of fixedComItem) {
      fetch(`http://localhost:8000/blockInfo/fixed/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bpName: "Commissioning Activities",
          data: fixed,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTestCount((prev) => prev + 1);
        });
    }

    for (const fixed of fixedTopItem) {
      fetch(`http://localhost:8000/blockInfo/fixed/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bpName: "Turnover Packages", data: fixed }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTestCount((prev) => prev + 1);
        });
    }
  };

  const [testCount, setTestCount] = useState(0);

  const rePositioning = () => {
    const diagram = diagramRef.current?.getDiagram();

    const rePositionData = JSON.parse(diagram.model.toJson());

    const rePositionNodeData = rePositionData.nodeDataArray.map((com) => {
      return {
        ...com,
        loc:
          Math.round(Number(com.loc.split(" ")[0]) / 100) * 100 +
          " " +
          Math.round(Number(com.loc.split(" ")[1]) / 100) * 100,
      };
    });

    const rePositionLinkData = rePositionData.linkDataArray.map((com) => {
      return {
        from: com.from,
        to: com.to,
      };
    });

    rePositionData.nodeDataArray = rePositionNodeData;
    rePositionData.linkDataArray = rePositionLinkData;
    diagram.model = go.Model.fromJson(JSON.stringify(rePositionData));
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
        <div className="buttonBox9">
          {/* <button id="SaveButton" className="saveButton" onClick={save}>
            Save
          </button>
          <button className="loadButton" onClick={load}>
            Load
          </button>
          <button id="FirstButton" name="first" onClick={filtering}>
            First
          </button>
          <button id="SecondButton" name="second" onClick={filtering}>
            Second
          </button>
          <button id="ThirdButton" name="third" onClick={filtering}>
            Third
          </button>
          <button id="ResetButton" name="reset" onClick={filtering}>
            Reset
          </button> */}
        </div>

        <div className="blockInsertBox">
          <div className="blockInsertBoxTitle">Card 추가하기</div>
          <select
            name="category"
            defaultValue="Commissioning Low"
            onChange={handleInsertData}
          >
            <option value="" disabled>
              Card를 선택해주세요
            </option>
            <option>Commissioning High</option>
            <option>Commissioning Medium</option>
            <option>Commissioning Low</option>
            <option>Turn-Over Package</option>
          </select>
          {insertDataToggle ? (
            <ComCardInsert
              insertData={insertData}
              handleInsertData={handleInsertData}
              diagramRef={diagramRef}
            />
          ) : (
            <TopCardInsert
              insertTopData={insertTopData}
              handleInsertTopData={handleInsertTopData}
              diagramRef={diagramRef}
            />
          )}
          <div className="InsertButtonBox">
            <button onClick={InsertBlockData}>Insert</button>
            <button onClick={finalDataSave}>Save</button>
            <button onClick={rePositioning}>Re Positioning</button>
            <div>{testCount}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockInsert;

const baseInsertComData = {
  key: "",
  category: "Low",
  uuu_P6ActivityName: "",
  planDate: "Plan Date",
  ddd_evm_plan_start: "",
  ddd_evm_plan_finish: "",
  uuu_P6PlannedDuration: "",
  actualDate: "Actual Date",
  ddd_evm_actual_start: "",
  ddd_evm_actual_finish: "",
  uuu_P6ActualDuration: "",
  record_no: "",
};

const baseInsertTopData = {
  key: "",
  category: "Top",
  uuu_P6ActivityName: "",
  planDate: "Plan Date",
  ddd_evm_plan_start: "",
  actualDate: "Actual Date",
  ddd_evm_actual_start: "",
  record_no: "",
};

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
