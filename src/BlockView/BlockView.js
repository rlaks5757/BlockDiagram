import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ReactDiagram, ReactOverview } from "gojs-react";
import * as go from "gojs";
import moment from "moment";
import Url from "../url/fetchURL";
import useViewPort from "../Hooks/useViewPort";
import "./BlockView.scss";
import axios from "axios";

const BlockView = () => {
  const { width, height } = useViewPort();
  const params = useParams();

  const [loadModelData, setLoadModelData] = useState(false);

  const diagramRef = useRef();

  const initDiagram = () => {
    const $ = go.GraphObject.make;

    const myDiagram = $(go.Diagram, {
      allowCopy: false,
      allowDelete: false,
      allowMove: false,
      allowDragOut: false,
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

    const goToLink = function (e, button) {
      var node = button.part.adornedPart;

      if (node.data.uuu_bp_record_url !== null) {
        // window.open("about:_blank").location.href = node.data.uuu_bp_record_url;
        window.open(
          node.data.uuu_bp_record_url,
          "_blank",
          "toolbar=0,location=0,menubar=0"
        );
      }
    };

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
          click: goToLink,
          alignment: go.Spot.TopRight,
        }, // this function is defined below
        new go.Binding("visible", "", (a) => !a.diagram.isReadOnly).ofObject(),
        $(go.Shape, "PlusLine", { desiredSize: new go.Size(6, 6) })
      )
    );

    myDiagram.nodeTemplateMap.add(
      "Low", // the default category
      $(
        go.Node,
        "Vertical",
        { selectionAdornmentTemplate: defaultAdornment },
        go.Panel.Auto,
        nodeStyle(),
        { click: clickEvent },
        {
          defaultRowSeparatorStroke: "gray",
          defaultColumnSeparatorStroke: "gray",
        },
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
        $(
          go.Shape,
          "RoundedRectangle",
          {
            fill: "white",
            strokeWidth: 2,
          },
          new go.Binding("stroke", "commBlockBorderColorSPD").makeTwoWay(),
          new go.Binding("strokeWidth", "isHighlighted", function (h) {
            return h ? 4 : 2;
          }).ofObject()
        ),
        new go.Binding("figure", "figure"),
        $(
          go.Panel,
          "Table",
          $(
            go.RowColumnDefinition,
            {
              row: 0,
              separatorStroke: "black",
              background: "white",
              coversSeparators: true,
            },
            new go.Binding("background", "commBlockTitleColorSPD").makeTwoWay()
          ),
          $(go.RowColumnDefinition, {
            row: 1,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(go.RowColumnDefinition, {
            row: 2,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(
            go.RowColumnDefinition,
            {
              row: 3,
              separatorStroke: "black",
              coversSeparators: false,
            },
            new go.Binding("background", "commBlockColorSPD").makeTwoWay()
          ),

          $(
            go.RowColumnDefinition,
            {
              row: 4,
              coversSeparators: false,
            },
            new go.Binding("background", "commBlockColorSPD").makeTwoWay()
          ),
          $(go.RowColumnDefinition, {
            row: 5,
            separatorStroke: "black",
            background: "white",
            coversSeparators: true,
          }),
          $(
            go.RowColumnDefinition,
            {
              row: 6,
              separatorStroke: "black",
              coversSeparators: false,
            },
            new go.Binding("background", "commBlockColorSPD").makeTwoWay()
          ),
          $(
            go.RowColumnDefinition,
            {
              row: 7,
              coversSeparators: false,
            },
            new go.Binding("background", "commBlockColorSPD").makeTwoWay()
          ),
          $(go.RowColumnDefinition, {
            row: 8,
            separatorStroke: "black",
            background: "white",
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

          $(go.TextBlock, new go.Binding("text", "commCardNoDA").makeTwoWay(), {
            editable: true,
            row: 0,
            column: 0,
            columnSpan: 3,
            margin: 5,
            width: 175,
            height: 25,
            verticalAlignment: go.Spot.Left,
            textAlign: "center",
            font: "bold 18px sans-serif",
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
              width: 175,
              height: 75,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 24px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "planDate").makeTwoWay(), {
            editable: true,

            row: 2,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 18px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_start").makeTwoWay(),
            {
              editable: true,
              textEditor: window.TextEditor,
              row: 3,
              column: 0,
              columnSpan: 1,
              width: 125,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_plan_finish").makeTwoWay(),
            {
              editable: true,
              textEditor: window.TextEditor,
              row: 4,
              column: 0,
              columnSpan: 1,
              width: 125,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6PlannedDuration").makeTwoWay(),
            {
              editable: true,
              row: 3,
              rowSpan: 2,
              column: 2,
              width: 50,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            }
          ),
          $(go.TextBlock, new go.Binding("text", "actualDate").makeTwoWay(), {
            editable: true,
            row: 5,
            column: 0,
            columnSpan: 3,
            margin: 5,
            textAlign: "center",
            font: "bold 18px sans-serif",
          }),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_start").makeTwoWay(),
            {
              editable: true,
              textEditor: window.TextEditor,
              row: 6,
              column: 0,
              columnSpan: 1,
              width: 125,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "ddd_evm_actual_finish").makeTwoWay(),
            {
              editable: true,
              textEditor: window.TextEditor,
              row: 7,
              column: 0,
              columnSpan: 1,
              width: 125,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            },
            {
              click: (e, node) => {
                console.log(e);
                console.log(node);
              },
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "uuu_P6ActualDuration").makeTwoWay(),
            {
              editable: true,
              row: 6,
              rowSpan: 2,
              column: 2,
              width: 50,
              margin: 5,
              textAlign: "center",
              font: "bold 18px sans-serif",
            }
          ),
          $(
            go.TextBlock,
            new go.Binding("text", "commSeqLogicText").makeTwoWay(),
            {
              editable: true,
              row: 8,
              column: 0,
              columnSpan: 3,
              margin: 5,
              height: 50,
              verticalAlignment: go.Spot.Left,
              textAlign: "center",
              font: "bold 18px sans-serif",
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
        { toArrow: "standard", strokeWidth: 5, fill: "gray" }
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
          `${Url}/blockInfo/${params.project_code}`
        );

        const comData = await fetchData.data.com;

        await comData.forEach((com) => {
          if (com.status !== "Deleted" || com.status !== "Terminated") {
            if (com.dtsDashCoordinates !== null) {
              baseSet.nodeDataArray.push({
                key: com.uuu_P6ActivityId,
                uuu_P6ActivityId: com.uuu_P6ActivityId,
                category: "Low",
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
                uuu_bp_record_url: com.uuu_bp_record_url,
                commSeqLogicText: com.commSeqLogicText,
                loc: com.dtsDashCoordinates,
                record_no: com.record_no,
                commBlockTitleColorSPD:
                  com.commBlockTitleColorSPD === null
                    ? "white"
                    : handleColor("title", com.commBlockTitleColorSPD),
                commBlockColorSPD:
                  com.commBlockColorSPD === null
                    ? "white"
                    : handleColor("block", com.commBlockColorSPD),
                commBlockBorderColorSPD:
                  com.commBlockBorderColorSPD === null
                    ? "black"
                    : handleColor("border", com.commBlockBorderColorSPD),
                commCardNoDA: com.commCardNoDA,
              });
            } else {
              baseSet.nodeDataArray.push({
                key: com.uuu_P6ActivityId,
                uuu_P6ActivityId: com.uuu_P6ActivityId,
                category: "Low",
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
                uuu_bp_record_url: com.uuu_bp_record_url,
                commSeqLogicText: com.commSeqLogicText,
                record_no: com.record_no,
                commBlockTitleColorSPD:
                  com.commBlockTitleColorSPD === null
                    ? "white"
                    : handleColor("title", com.commBlockTitleColorSPD),
                commBlockColorSPD:
                  com.commBlockColorSPD === null
                    ? "white"
                    : handleColor("block", com.commBlockColorSPD),
                commBlockBorderColorSPD:
                  com.commBlockBorderColorSPD === null
                    ? "black"
                    : handleColor("border", com.commBlockBorderColorSPD),
                commCardNoDA: com.commCardNoDA,
              });
            }
          }
        });

        await comData.forEach((com) => {
          if (com.status !== "Deleted") {
            if (com._bp_lineitems !== undefined) {
              if (com._bp_lineitems.length > 0) {
                com._bp_lineitems.forEach((com2) => {
                  if (
                    com2.uuu_tab_id === "Relationship" &&
                    com2.dtsPredSuccSRB === "Successor"
                  )
                    baseSet.linkDataArray.push({
                      from: com.uuu_P6ActivityId,
                      to: com2.dtsCommActivityBPK,
                      points:
                        com2.dtsDashCoordinates !== null
                          ? com2.dtsDashCoordinates
                              .split(",")
                              .map((com) => Number(com))
                          : null,
                      dtsLineAutoSeq: com2.dtsLineAutoSeq,
                    });
                });
              }
            }
          }
        });

        diagram.model = go.Model.fromJson(JSON.stringify(baseSet));
      } catch (err) {
        console.log(err);
      }
    };

    commissionFetch();
  }, [params.project_code]);

  function myCallback(blob) {
    var url = window.URL.createObjectURL(blob);
    var filename = `${params.project_code}_block_diagram.png`;

    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;

    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, filename);
      return;
    }

    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }

  const exportAsImage = async () => {
    const diagram = diagramRef.current?.getDiagram();

    diagram.makeImageData({
      background: "white",
      returnType: "blob",
      callback: myCallback,
    });
  };

  return (
    <>
      <div className="blockInsert">
        <div style={{ width, height: height - 33 - 32 }}>
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
        </div>

        <div className="controlButtonBox">
          <button
            onClick={() => {
              exportAsImage();
            }}
          >
            이미지 저장
          </button>
        </div>
      </div>
    </>
  );
};

export default BlockView;

const colorList = [
  { name: "RED", color: "rgb(255, 50, 0)" },
  { name: "GREEN", color: "rgb(0, 200, 100)" },
  { name: "BLUE", color: "rgb(100, 150, 250)" },
  { name: "ORANGE", color: "rgb(255, 200, 0)" },
  { name: "PINK", color: "rgb(255, 230, 220)" },
  { name: "YELLOW", color: "rgb(255, 255, 200)" },
  { name: "BLACK", color: "rgb(0, 0, 0)" },
  { name: "WHITE", color: "rgb(255, 255, 255)" },
];

const handleColor = (type, colorName) => {
  const color_result = colorList.find((com) => com.name === colorName);

  if (type === "border") {
    return color_result?.["color"] === undefined
      ? "black"
      : color_result?.["color"];
  } else {
    return color_result?.["color"] === undefined
      ? "white"
      : color_result?.["color"];
  }
};
