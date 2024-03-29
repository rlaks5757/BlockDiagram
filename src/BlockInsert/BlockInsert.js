import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import { ReactDiagram, ReactOverview } from "gojs-react";
import moment from "moment";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import "./BlockInsert.scss";
import ComCardInsert from "./ComCardInsert/ComCardInsert";
import axios from "axios";
import Url from "../url/fetchURL";
import useViewPort from "../Hooks/useViewPort";
import "./InsertModal.scss";

const BlockInsert = () => {
  const { width, height } = useViewPort();
  const params = useParams();
  const [originalComBaseSet, setOriginalComBaseSet] = useState({});

  const [comOriginalData, setComOriginalData] = useState([]);

  const [insertDataToggle, setInsertDataToogle] = useState(true);

  const [insertData, setInsertData] = useState(baseInsertComData);

  const [loadModelData, setLoadModelData] = useState(false);

  const [visibleDialog, setVisibleDialog] = useState(false);

  const [progressActual, setProgressActual] = useState(0);
  const [, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const [errorItem, setErrorItem] = useState([]);

  const [progressVisibleDialog, setProgressVisibleDialog] = useState(false);

  const diagramRef = useRef();

  const useConfirm = (message = null, onConfirm, onCancel) => {
    if (!onConfirm || typeof onConfirm !== "function") {
      return;
    }
    if (onCancel && typeof onCancel !== "function") {
      return;
    }

    const confirmAction = () => {
      if (window.confirm(message())) {
        onConfirm();
      } else {
        onCancel();
      }
    };

    return confirmAction;
  };

  const deleteList = () => {
    const diagram = diagramRef.current.getDiagram();

    const selectNode = [];

    diagram.selection.each((e) => {
      if (e.data.key !== undefined) {
        selectNode.push(e.data.uuu_P6ActivityName);
      }
    });

    return "삭제 목록: " + selectNode.join();
  };

  const deleteConfirm = () => {
    const diagram = diagramRef.current?.getDiagram();

    const selectNode = [];

    diagram.selection.each((e) => {
      if (e.data.key !== undefined) {
        selectNode.push(e.data.key);
      }
    });

    const insertNodeData = JSON.parse(diagram.model.toJson());

    const nodeDatas = insertNodeData.nodeDataArray.filter(
      (com) => !selectNode.includes(com.key)
    );

    const linkDatas = insertNodeData.linkDataArray.filter(
      (com) => !selectNode.includes(com.to)
    );

    insertNodeData.nodeDataArray = nodeDatas;
    insertNodeData.linkDataArray = linkDatas;
    diagram.model = go.Model.fromJson(JSON.stringify(insertNodeData));

    alert("삭제했습니다.");
  };

  const cancelConfirm = () => {
    alert("취소했습니다.");
  };

  const confirmDelete = useConfirm(deleteList, deleteConfirm, cancelConfirm);

  const initDiagram = () => {
    const $ = go.GraphObject.make;

    const myDiagram = $(go.Diagram, {
      allowCopy: false,
      // allowZoom: false,
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

    myDiagram.commandHandler.doKeyDown = function () {
      var e = myDiagram.lastInput;

      if (e.key === "Backspace") {
        confirmDelete();
        return;
      }
    };

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

      diagram.commandHandler.doKeyDown = function () {
        var e = myDiagram.lastInput;

        if (e.key === "Backspace") {
          confirmDelete();
        }
      };
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

      const comBaseSet = comData.filter((com) => com.status !== "Deleted");

      const comID = comData.map((com) => {
        return {
          ...com,
          uuu_P6ActivityId: com.uuu_P6ActivityId,
          status: com.status,
        };
      });

      setOriginalComBaseSet(comBaseSet);

      setComOriginalData(comID);

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
  }, [params.project_code]);

  const handleInsertData = (e) => {
    const { value, name } = e.target;

    if (name === "uuu_P6ActivityName" || name === "commSeqLogicText") {
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
    } else if (name === "commCardNoDA") {
      setInsertData((prev) => {
        return {
          ...prev,
          commCardNoDA: value,
        };
      });
    } else if (name === "category") {
      if (value === "Turn-Over Package") {
        setInsertDataToogle(false);
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

  const InsertBlockData = () => {
    const checkItem = comOriginalData.find(
      (com) => com.uuu_P6ActivityId === insertData.key
    );

    if (checkItem !== undefined) {
      insertData.record_no = checkItem.record_no;
    }

    const diagram = diagramRef.current?.getDiagram();

    const insertNodeData = JSON.parse(diagram.model.toJson());

    if (insertDataToggle) {
      if (
        insertData.key.length > 0 &&
        insertData.uuu_P6ActivityName.length > 0 &&
        insertData.ddd_evm_plan_start.length > 0 &&
        insertData.ddd_evm_plan_finish.length > 0
      ) {
        insertNodeData.nodeDataArray.push(insertData);
        diagram.model = go.Model.fromJson(JSON.stringify(insertNodeData));
        toggleDialog();
        setInsertData(baseInsertComData);
      } else {
        alert("필수값을 모두 입력하여 주시기 바랍니다.");
      }
    } else {
      alert("필수값을 모두 입력하여 주시기 바랍니다.");
    }
  };

  const finalDataSave = async () => {
    setProgressVisibleDialog(true);

    const diagram = diagramRef.current?.getDiagram();

    const insertNodeData = JSON.parse(diagram.model.toJson());

    let comData = [];

    insertNodeData.nodeDataArray.forEach((com) => {
      comData.push({
        uuu_P6ActivityId: com.key,
        uuu_P6ActivityName: com.uuu_P6ActivityName,
        ddd_evm_plan_start:
          com.ddd_evm_plan_start === null || com.ddd_evm_plan_start.length === 0
            ? " "
            : moment(new Date(com.ddd_evm_plan_start)).format(
                "MM-DD-YYYY 00:00:00"
              ),
        ddd_evm_plan_finish:
          com.ddd_evm_plan_finish === null ||
          com.ddd_evm_plan_finish.length === 0
            ? " "
            : moment(new Date(com.ddd_evm_plan_finish)).format(
                "MM-DD-YYYY 00:00:00"
              ),
        uuu_P6PlannedDuration: com.uuu_P6PlannedDuration,
        ddd_evm_actual_start:
          com.ddd_evm_actual_start === null ||
          com.ddd_evm_actual_start.length === 0
            ? " "
            : moment(new Date(com.ddd_evm_actual_start)).format(
                "MM-DD-YYYY 00:00:00"
              ),
        ddd_evm_actual_finish:
          com.ddd_evm_actual_finish === null ||
          com.ddd_evm_actual_finish.length === 0
            ? " "
            : moment(new Date(com.ddd_evm_actual_finish)).format(
                "MM-DD-YYYY 00:00:00"
              ),
        uuu_P6ActualDuration: com.uuu_P6ActualDuration,
        status:
          com.ddd_evm_actual_finish === null &&
          com.ddd_evm_actual_start === null
            ? "Not_Started"
            : com.ddd_evm_actual_finish !== null &&
              com.ddd_evm_actual_start !== null
            ? "Completed"
            : com.ddd_evm_actual_start !== null && "In_Progress",
        dtsDashCoordinates: com.loc,
        dtsPrioritySPD: com.category,
        record_no: com.record_no,
        commSeqLogicText: com.commSeqLogicText,
        commCardNoDA: com.commCardNoDA,
        _bp_lineitems: [],
      });
    });

    comData.forEach((com) => {
      insertNodeData.linkDataArray.forEach((com2) => {
        if (com.uuu_P6ActivityId === com2.from) {
          com._bp_lineitems.push({
            dtsPredSuccSRB: "Successor",
            dtsCommActivityBPK: com2.to,
            dtsDashCoordinates: com2.points.join(),
            uuu_P6ActivityName: insertNodeData.nodeDataArray.filter((com3) => {
              return com3.key === com2.to;
            })[0]["uuu_P6ActivityName"],
            dtsLineAutoSeq:
              com2.dtsLineAutoSeq !== undefined
                ? com2.dtsLineAutoSeq
                : String(Math.round(Math.random() * 1000000000000)),
            short_desc: "1",
          });
        } else if (com.uuu_P6ActivityId === com2.to) {
          com._bp_lineitems.push({
            dtsPredSuccSRB: "Predecessor",
            dtsCommActivityBPK: com2.from,
            dtsDashCoordinates: com2.points.join(),
            uuu_P6ActivityName: insertNodeData.nodeDataArray.filter((com3) => {
              return com3.key === com2.from;
            })[0]["uuu_P6ActivityName"],
            dtsLineAutoSeq:
              com2.dtsLineAutoSeq !== undefined
                ? com2.dtsLineAutoSeq
                : String(Math.round(Math.random() * 1000000000000)),
            short_desc: "1",
          });
        }
      });
    });

    console.log(comData);

    // comData.forEach((com) => {
    //   insertNodeData.linkDataArray.forEach((com2) => {
    //     if (com.uuu_P6ActivityId === com2.from) {
    //       if (com2.dtsLineAutoSeq !== undefined) {
    //         com._bp_lineitems.push({
    //           dtsPredSuccSRB: "Successor",
    //           dtsCommActivityBPK: com2.to,
    //           dtsDashCoordinates: com2.points.join(),
    //           uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
    //             (com3) => {
    //               return com3.key === com2.to;
    //             }
    //           )[0]["uuu_P6ActivityName"],
    //           dtsLineAutoSeq: com2.dtsLineAutoSeq,
    //           short_desc: "1",
    //         });
    //       } else {
    //         com._bp_lineitems.push({
    //           dtsPredSuccSRB: "Successor",
    //           dtsCommActivityBPK: com2.to,
    //           dtsDashCoordinates: com2.points.join(),
    //           uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
    //             (com3) => {
    //               return com3.key === com2.to;
    //             }
    //           )[0]["uuu_P6ActivityName"],
    //           dtsLineAutoSeq: String(Math.round(Math.random() * 1000000000000)),
    //           short_desc: "1",
    //         });
    //       }
    //     } else {
    //       if (com2.dtsLineAutoSeq !== undefined) {
    //         com._bp_lineitems.push({
    //           dtsPredSuccSRB: "Predecessor",
    //           dtsCommActivityBPK: com2.to,
    //           dtsDashCoordinates: com2.points.join(),
    //           uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
    //             (com3) => {
    //               return com3.key === com2.to;
    //             }
    //           )[0]["uuu_P6ActivityName"],
    //           dtsLineAutoSeq: com2.dtsLineAutoSeq,
    //           short_desc: "1",
    //         });
    //       } else {
    //         com._bp_lineitems.push({
    //           dtsPredSuccSRB: "Predecessor",
    //           dtsCommActivityBPK: com2.to,
    //           dtsDashCoordinates: com2.points.join(),
    //           uuu_P6ActivityName: insertNodeData.nodeDataArray.filter(
    //             (com3) => {
    //               return com3.key === com2.to;
    //             }
    //           )[0]["uuu_P6ActivityName"],
    //           dtsLineAutoSeq: String(Math.round(Math.random() * 1000000000000)),
    //           short_desc: "1",
    //         });
    //       }
    //     }
    //   });
    // });

    const noneDeleteItem = await insertNodeData.nodeDataArray.map((com) => {
      return com.key;
    });

    const comDifference = await originalComBaseSet.filter(
      (x) => !noneDeleteItem.includes(x.uuu_P6ActivityId)
    );

    const comDeleteitemChange = await comDifference.map((com) => {
      return { ...com, status: "Deleted" };
    });

    const finalComData = await comData.concat(comDeleteitemChange);

    const fetchData = await axios.get(
      `${Url}/blockInfo/${params.project_code}`
    );

    const lastestComFetchData = await fetchData.data.com;

    //com
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

    finalComData.forEach((com) => {
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

    //Delete Items Finish

    const originalComdataID = lastestComFetchData.map(
      (com) => com.uuu_P6ActivityId
    );

    //Input Items Start

    const newComItem = finalComData.filter(
      (x) => !originalComdataID.includes(x.uuu_P6ActivityId)
    );

    //Input Items Finish

    //fixed Items Start
    const fixedComItem = finalComData.filter((x) =>
      originalComdataID.includes(x.uuu_P6ActivityId)
    );

    const deleteComFinalCount = deleteComFinal.filter(
      (com) => com._bp_lineitems.length > 0
    );

    setProgressTotal(
      newComItem.length + deleteComFinalCount.length + fixedComItem.length
    );

    const errTotal = [];

    //oracle request
    //Input
    for (const inputItem of newComItem) {
      fetch(`${Url}/blockInfo/new/${params.project_code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bpName: "Commissioning Activities",
          data: inputItem,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setProgressActual((prev) => prev + 1);
          if (data.data.status === 200) {
            setProgress((prev) => prev + 1);
          } else {
            errTotal.push(data.data.message);
          }
        })
        .catch((err) => console.log(err));
    }

    //Delete
    for (const deleteItem of deleteComFinal) {
      if (deleteItem._bp_lineitems.length > 0) {
        fetch(`${Url}/blockInfo/delete/${params.project_code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bpName: "Commissioning Activities",
            record_no: deleteItem.record_no,
            _bp_lineitems: deleteItem._bp_lineitems.join(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setProgressActual((prev) => prev + 1);
            if (data.data.status === 200) {
              setProgress((prev) => prev + 1);
            } else {
              errTotal.push(data.data.message);
            }
          });
      }
    }

    //Fixed
    for (const fixed of fixedComItem) {
      fetch(`${Url}/blockInfo/fixed/${params.project_code}`, {
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
          setProgressActual((prev) => prev + 1);
          if (data.data.status === 200) {
            setProgress((prev) => prev + 1);
          } else {
            errTotal.push(data.data.message);
          }
        });
    }

    setErrorItem(errTotal);
  };

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

  const toggleDialog = () => {
    setVisibleDialog(!visibleDialog);
    setInsertData(baseInsertComData);
  };

  const handleProgressVisibleDialog = () => {
    if (progressActual === 0) {
      alert("업데이트가 진행 중입니다.");
    } else if (progressActual === progressTotal) {
      setProgressVisibleDialog(false);
      setProgressActual(0);
      setProgress(0);
      setProgressTotal(0);
      setErrorItem([]);
      commissionFetch();
    } else {
      alert("업데이트가 진행 중입니다.");
    }
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
          <button onClick={rePositioning}>Re Positioning</button>
          <button onClick={toggleDialog}>추가하기</button>
          <button onClick={finalDataSave}>저장하기</button>
        </div>

        {visibleDialog && (
          <Dialog title={"Card Add"} onClose={toggleDialog}>
            <div className="blockInsertModal">
              <ComCardInsert
                insertData={insertData}
                setInsertData={setInsertData}
                handleInsertData={handleInsertData}
                comOriginalData={comOriginalData}
              />
            </div>

            <DialogActionsBar>
              <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                onClick={() => {
                  toggleDialog();
                }}
              >
                취소
              </button>
              <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                onClick={() => {
                  InsertBlockData();
                }}
              >
                추가
              </button>
            </DialogActionsBar>
          </Dialog>
        )}
        {progressVisibleDialog && (
          <Dialog title={"Flow-Diagram Update"}>
            <div className="updateProgressBox">
              <ProgressBar
                min={0}
                max={100}
                value={parseInt((progressActual / progressTotal) * 100)}
              />
              <div className="updateProgressResult">
                처리결과:{" "}
                {progressActual > 0 && progressActual / progressTotal === 1
                  ? "업데이트를 완료하였습니다."
                  : errorItem.length === 0
                  ? "업데이트를 진행 중입니다."
                  : "아래의 에러코드를 확인하여 주시기 바랍니다."}
              </div>
              <div className="updateProgressTableBox">
                {errorItem.length > 0 && (
                  <>
                    <div className="updateProgressTable">
                      <div
                        className="updateProgressFirst"
                        style={{ fontWeight: "bold" }}
                      >
                        No.
                      </div>
                      <div
                        className="updateProgressSecond"
                        style={{ fontWeight: "bold" }}
                      >
                        Activity_Name
                      </div>
                      <div
                        className="updateProgressThrid"
                        style={{ fontWeight: "bold" }}
                      >
                        Record_No
                      </div>
                      <div
                        className="updateProgressThrid"
                        style={{ fontWeight: "bold" }}
                      >
                        Error_Code
                      </div>
                    </div>
                    {errorItem.map((com, idx) => {
                      return (
                        <div className="updateProgressTable" key={idx}>
                          <div className="updateProgressFirst">{idx + 1}</div>
                          <div className="updateProgressSecond">
                            {com[0].uuu_P6ActivityId !== undefined
                              ? com[0].uuu_P6ActivityId
                              : com[0].dtsTOPTitle !== undefined &&
                                com[0].dtsTOPTitle}
                          </div>
                          <div className="updateProgressThrid">
                            {com[0].record_no}
                          </div>
                          <div className="updateProgressThrid">
                            {com[0]._record_status}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <DialogActionsBar>
              <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                onClick={handleProgressVisibleDialog}
                disabled={
                  !progressActual > 0 && progressActual / progressTotal === 1
                }
              >
                완료
              </button>
            </DialogActionsBar>
          </Dialog>
        )}
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
  uuu_P6PlannedDuration: 0,
  actualDate: "Actual Date",
  ddd_evm_actual_start: "",
  ddd_evm_actual_finish: "",
  uuu_P6ActualDuration: 0,
  commSeqLogicText: "",
  record_no: "",
  commCardNoDA: 0,
};

//TextEditor
(function (window) {
  var textarea = document.createElement("input");
  textarea.type = "date";
  textarea.id = "myTextArea";

  textarea.addEventListener(
    "input",
    function (e) {
      var tool = TextEditor.tool;
      if (tool.textBlock === null) return;

      var tempText = tool.measureTemporaryTextBlock(
        moment(this.value).format("YYYY-MM-DD")
      );
      var scale = this.textScale;
      this.style.width = 20 + tempText.measuredBounds.width * scale + "px";
      this.rows = tempText.lineCount;
    },
    false
  );

  textarea.addEventListener(
    "keydown",
    function (e) {
      var tool = TextEditor.tool;
      if (tool.textBlock === null) return;
      var key = e.key;
      if (key === "Enter") {
        if (tool.textBlock.isMultiline === false) e.preventDefault();
        tool.acceptText(go.TextEditingTool.Enter);
        return;
      } else if (key === "Tab") {
        tool.acceptText(go.TextEditingTool.Tab);
        e.preventDefault();
        return;
      } else if (key === "Escape") {
        tool.doCancel();
        if (tool.diagram !== null) tool.diagram.doFocus();
      }
    },
    false
  );

  // handle focus:
  textarea.addEventListener(
    "focus",
    function (e) {
      var tool = TextEditor.tool;
      if (!tool || tool.currentTextEditor === null) return;

      if (tool.state === go.TextEditingTool.StateActive) {
        tool.state = go.TextEditingTool.StateEditing;
      }

      if (tool.selectsTextOnActivate) {
        textarea.select();
        // textarea.setSelectionRange(0, 9999);
      }
    },
    false
  );

  // Disallow blur.
  // If the textEditingTool blurs and the text is not valid,
  // we do not want focus taken off the element just because a user clicked elsewhere.
  textarea.addEventListener(
    "blur",
    function (e) {
      var tool = TextEditor.tool;
      if (
        !tool ||
        tool.currentTextEditor === null ||
        tool.state === go.TextEditingTool.StateNone
      )
        return;

      textarea.focus();

      if (tool.selectsTextOnActivate) {
        textarea.select();
        // textarea.setSelectionRange(0, 9999);
      }
    },
    false
  );

  var TextEditor = new go.HTMLInfo();

  TextEditor.valueFunction = function () {
    if (textarea.value.length > 0) {
      return moment(new Date(textarea.value)).format("MM-DD-YYYY");
    } else {
      return textarea.value;
    }
  };

  TextEditor.mainElement = textarea; // to reference it more easily

  TextEditor.tool = null; // Initialize

  // used to be in doActivate
  TextEditor.show = function (textBlock, diagram, tool) {
    if (!(textBlock instanceof go.TextBlock)) return;
    if (TextEditor.tool !== null) return; // Only one at a time.

    TextEditor.tool = tool; // remember the TextEditingTool for use by listeners

    // This is called during validation, if validation failed:
    if (tool.state === go.TextEditingTool.StateInvalid) {
      textarea.style.border = "3px solid red";
      textarea.focus();
      return;
    }

    // This part is called during initalization:

    var loc = textBlock.getDocumentPoint(go.Spot.Center);
    var pos = diagram.position;
    var sc = diagram.scale;
    var textscale = textBlock.getDocumentScale() * sc;
    if (textscale < tool.minimumEditorScale)
      textscale = tool.minimumEditorScale;
    // Add slightly more width/height to stop scrollbars and line wrapping on some browsers
    // +6 is firefox minimum, otherwise lines will be wrapped improperly
    var textwidth = textBlock.naturalBounds.width * textscale + 6;
    var textheight = textBlock.naturalBounds.height * textscale + 2;
    var left = (loc.x - pos.x) * sc;
    var yCenter = (loc.y - pos.y) * sc; // this is actually the center, used to set style.top
    var valign = textBlock.verticalAlignment;
    var oneLineHeight =
      textBlock.lineHeight + textBlock.spacingAbove + textBlock.spacingBelow;
    var allLinesHeight = oneLineHeight * textBlock.lineCount * textscale;
    var center = 0.5 * textheight - 0.5 * allLinesHeight;
    // add offset to yCenter to get the appropriate position:
    var yOffset =
      valign.y * textheight -
      valign.y * allLinesHeight +
      valign.offsetY -
      center -
      allLinesHeight / 2;

    textarea.value = moment(new Date(textBlock.text)).format("YYYY-MM-DD");
    // the only way you can mix font and fontSize is if the font inherits and the fontSize overrides
    // in the future maybe have textarea contained in its own div
    diagram.div.style["font"] = textBlock.font;

    var paddingsize = 1;
    textarea.style["position"] = "absolute";
    textarea.style["zIndex"] = "100";
    textarea.style["font"] = "inherit";
    textarea.style["fontSize"] = textscale * 100 + "%";
    textarea.style["lineHeight"] = "normal";
    textarea.style["width"] = textwidth + "px";
    textarea.style["left"] = ((left - textwidth / 2) | 0) - paddingsize + "px";
    textarea.style["top"] = ((yCenter + yOffset) | 0) - paddingsize + "px";
    textarea.style["textAlign"] = textBlock.textAlign;
    textarea.style["margin"] = "0";
    textarea.style["padding"] = paddingsize + "px";
    textarea.style["border"] = "0";
    textarea.style["outline"] = "none";
    textarea.style["whiteSpace"] = "pre-wrap";
    textarea.style["overflow"] = "hidden"; // for proper IE wrap
    textarea.rows = textBlock.lineCount;
    textarea.textScale = textscale; // attach a value to the textarea, for convenience
    textarea.className = "goTXarea";

    // Show:
    diagram.div.appendChild(textarea);

    // After adding, focus:
    textarea.focus();
    if (tool.selectsTextOnActivate) {
      textarea.select();
      // textarea.setSelectionRange(0, 9999);
    }
  };

  TextEditor.hide = function (diagram, tool) {
    diagram.div.removeChild(textarea);
    TextEditor.tool = null; // forget reference to TextEditingTool
  };

  window.TextEditor = TextEditor;
})(window);

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
