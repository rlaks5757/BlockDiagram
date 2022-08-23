import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Chart,
  ChartSeries,
  ChartSeriesItem,
  ChartValueAxis,
  ChartValueAxisItem,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartTitle,
  ChartLegend,
  ChartTooltip,
} from "@progress/kendo-react-charts";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import "hammerjs";
import axios from "axios";
import moment from "moment";
import _ from "lodash";
import Tooltip from "./Tooltip";
import Url from "../url/fetchURL";
import useViewPort from "../Hooks/useViewPort";
import "./SCurveChart.scss";

const SCurveChart = () => {
  const { height } = useViewPort();
  const params = useParams();

  const [chartData, setChartData] = useState({
    categories: [],
    series: [],
  });

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const commissionFetch = async () => {
      const fetchData = await axios.get(`${Url}/blockInfo/${params.id}`);

      const filteringData = fetchData.data.com.filter(
        (com) => com.status !== "Deleted"
      );

      const originalData = filteringData.sort((a, b) => {
        a = new Date(a.ddd_evm_plan_start);
        b = new Date(b.ddd_evm_plan_start);
        return a < b ? -1 : a > b ? 1 : 0;
      });
      //catefories
      const diffMonth = getMonthDifference(
        new Date(originalData[0].ddd_evm_plan_start),
        new Date(originalData[originalData.length - 1].ddd_evm_plan_finish)
      );

      const cateforiesArr = [];

      for (let i = 0; i <= diffMonth; i++) {
        cateforiesArr.push(
          moment(new Date(originalData[0].ddd_evm_plan_start))
            .add(i, "months")
            .format("YY년 MM월")
        );
      }

      //plan & c_plan

      const originalDataPlan = [];

      originalData.forEach((com) => {
        for (let i = 0; i < com.uuu_P6PlannedDuration; i++) {
          originalDataPlan.push({
            date: moment(new Date(com.ddd_evm_plan_start))
              .add(i, "days")
              .format("YY년 MM월"),
            value: com.dtsCommActWV / com.uuu_P6PlannedDuration,
          });
        }
      });

      const resultPlan = cateforiesArr.map((com) => {
        return {
          date: com,
          value: _.sumBy(
            originalDataPlan.filter((com2) => {
              return com === com2.date;
            }),
            "value"
          ),
        };
      });

      resultPlan.reduce((acc, cur) => {
        return (cur.reduce = acc + cur.value);
      }, 0);

      //actaul & c_actaul
      const originalDataAct = [];

      originalData.forEach((com) => {
        for (let i = 0; i < com.uuu_P6ActualDuration; i++) {
          if (com.status === "Completed")
            originalDataAct.push({
              date: moment(new Date(com.ddd_evm_actual_start))
                .add(i, "days")
                .format("YY년 MM월"),
              value: com.dtsCommActWV / com.uuu_P6ActualDuration,
            });
        }
      });

      const resultAct = cateforiesArr.map((com) => {
        return {
          date: com,
          value: _.sumBy(
            originalDataAct.filter((com2) => {
              return com === com2.date;
            }),
            "value"
          ),
        };
      });

      resultAct.reduce((acc, cur) => {
        const actDate = new Date();
        actDate.setFullYear(`20${cur.date.slice(0, 2)}`);
        actDate.setMonth(cur.date.slice(4, 6) - 1);

        if (moment(actDate).format("YY-MM") <= moment().format("YY-MM")) {
          return (cur.reduce = acc + cur.value);
        }
        return false;
      }, 0);

      //Chart Data Result
      setChartData((prev) => {
        return {
          ...prev,
          categories: resultPlan.map((com) => com.date),
          series: [
            {
              name: "월간 계획",
              type: "column",
              data: resultPlan.map((com) => com.value / 1000),
            },
            {
              name: "월간 실적",
              type: "column",
              data: resultAct.map((com) => com.value / 1000),
            },
            {
              name: "누적 계획",
              type: "line",
              data: resultPlan
                .filter((com) => com.reduce)
                .map((com2) => com2.reduce / 1000),
            },
            {
              name: "누적 실적",
              type: "line",
              data: resultAct
                .filter((com) => com.reduce)
                .map((com2) => com2.reduce / 1000),
            },
          ],
        };
      });

      //tableData
      const tableDataBase = cateforiesArr.map((com) => {
        return {
          date: com,
          plan: resultPlan.find((com2) => com2.date === com)["value"] / 1000,
          act: resultAct.find((com2) => com2.date === com)["value"] / 1000,
          diff:
            resultAct.find((com2) => com2.date === com)["reduce"] === undefined
              ? 0
              : resultAct.find((com2) => com2.date === com)["value"] / 1000 -
                resultPlan.find((com2) => com2.date === com)["value"] / 1000,
          c_plan: resultPlan.find((com2) => com2.date === com)["reduce"] / 1000,
          c_act:
            resultAct.find((com2) => com2.date === com)["reduce"] === undefined
              ? 0
              : resultAct.find((com2) => com2.date === com)["reduce"] / 1000,
          c_diff:
            resultAct.find((com2) => com2.date === com)["reduce"] === undefined
              ? 0
              : resultAct.find((com2) => com2.date === com)["reduce"] / 1000 -
                resultPlan.find((com2) => com2.date === com)["reduce"] / 1000,
        };
      });

      setTableData(tableDataBase);
    };

    commissionFetch();
  }, [params]);

  const tableContent = (com, com1) => {
    if (com.field === "diff") {
      if (handleActionDate(com1)) {
        return (com1["act"] - com1["plan"]).toFixed(2);
      } else {
        return "-";
      }
    } else if (com.field === "c_diff") {
      if (handleActionDate(com1)) {
        return (com1["c_act"] - com1["c_plan"]).toFixed(2);
      } else {
        return "-";
      }
    } else if (com.field === "act" || com.field === "c_act") {
      if (handleActionDate(com1)) {
        return com1[com.field].toFixed(2);
      } else {
        return "-";
      }
    } else {
      return com1[com.field].toFixed(2);
    }
  };

  const handleActionDate = (date) => {
    const actDate = new Date();
    actDate.setFullYear(`20${date.date.slice(0, 2)}`);
    actDate.setMonth(date.date.slice(4, 6) - 1);

    if (moment(actDate).format("YY-MM") <= moment().format("YY-MM")) {
      return true;
    }
    return false;
  };

  const fieldData = [
    {
      name: "월간 계획",
      field: "plan",
    },
    {
      name: "월간 실적",
      field: "act",
    },
    {
      name: "월간 차이",
      field: "diff",
    },
    {
      name: "누적 계획",
      field: "c_plan",
    },
    {
      name: "누적 실적",
      field: "c_act",
    },
    {
      name: "누적 차이",
      field: "c_diff",
    },
  ];

  const tooltipRender = (context) => <Tooltip {...context} />;

  const normalcell = (props) => {
    const field = props.field || "";
    const cell = props.dataItem[field];

    const handleFontColor = () => {
      if (field === "diff" || field === "c_diff") {
        if (cell < 0) {
          return "red";
        } else {
          return "blue";
        }
      } else {
        return;
      }
    };

    const handleFontWeight = () => {
      if (field === "diff" || field === "c_diff") {
        return "bold";
      } else {
        return;
      }
    };

    const actDate = new Date();
    actDate.setFullYear(`20${props.dataItem.date.slice(0, 2)}`);
    actDate.setMonth(props.dataItem.date.slice(4, 6) - 1);

    return (
      <>
        {moment(actDate).format("YY-MM") <= moment().format("YY-MM") ? (
          <td
            colSpan={props.colSpan}
            aria-colindex={props.columnIndex}
            data-grid-col-index={props.dataIndex}
            style={{
              color: handleFontColor(),
              fontWeight: handleFontWeight(),
            }}
          >
            {cell.toFixed(2)}
          </td>
        ) : (
          <td
            colSpan={props.colSpan}
            aria-colindex={props.columnIndex}
            data-grid-col-index={props.dataIndex}
          >
            {field === "plan" || field === "c_plan" ? cell.toFixed(2) : "-"}
          </td>
        )}
      </>
    );
  };

  const SimpleSumCell = (props) => {
    const field = props.field || "";

    if (field !== "date") {
      const total = _.sumBy(
        tableData.filter((item) => typeof item[field] !== "undefined"),
        field
      );

      return (
        <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
          {total.toFixed(2)}
        </td>
      );
    } else {
      return (
        <td colSpan={props.colSpan} style={{ textAlign: "center" }}>
          합계
        </td>
      );
    }
  };

  const labelContentAxis = (e) => {
    return e.value > 100000000
      ? (e.value / 100000000).toFixed(2) + "억"
      : e.value;
  };

  return (
    <div>
      {chartData.categories.length > 0 && (
        <Chart
          style={{
            height: (height - 65) / 2,
          }}
        >
          <ChartTitle text="Commissioning S-Curve" />
          <ChartLegend position="bottom" orientation="horizontal" />
          <ChartValueAxis>
            <ChartValueAxisItem
              labels={{
                content: labelContentAxis,
                font: "0.7rem Arial, sans-serif",
              }}
            />
          </ChartValueAxis>
          <ChartCategoryAxis>
            <ChartCategoryAxisItem
              categories={chartData.categories}
              startAngle={45}
            />
          </ChartCategoryAxis>
          <ChartTooltip shared={true} render={tooltipRender} />
          <ChartSeries>
            {chartData.series.map((item, idx) => (
              <ChartSeriesItem
                key={idx}
                type={item.type}
                tooltip={{
                  visible: true,
                }}
                data={item.data}
                name={item.name}
              />
            ))}
          </ChartSeries>
        </Chart>
      )}

      <Grid
        style={{
          height: (height - 65 - 20) / 2,
        }}
        data={tableData}
        className="sCurveTable"
      >
        <GridColumn field="date" title="구분" footerCell={SimpleSumCell} />
        <GridColumn
          field="plan"
          title="월간 계획"
          cell={normalcell}
          footerCell={SimpleSumCell}
        />

        <GridColumn
          field="act"
          title="월간 실적"
          cell={normalcell}
          footerCell={SimpleSumCell}
        />
        <GridColumn field="diff" title="월간 차이" cell={normalcell} />
        <GridColumn field="c_plan" title="누적 계획" cell={normalcell} />
        <GridColumn field="c_act" title="누적 실적" cell={normalcell} />
        <GridColumn field="c_diff" title="누적 차이" cell={normalcell} />
      </Grid>
    </div>
  );
};

export default SCurveChart;

const getMonthDifference = (startDate, endDate) => {
  return (
    endDate.getMonth() -
    startDate.getMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
};

/* {tableData.length > 0 && (
        <div className="sCurveTable" style={{ width: width - 34 }}>
          <div className="sCurveTableHeader">
            <div
              className="sCurveTableHeaderItem"
              style={{ width: tableData.length > 14 ? "100px" : "8%" }}
            >
              구분
            </div>
            {tableData.map((com, idx) => (
              <div
                key={idx}
                className="sCurveTableHeaderItem"
                style={{
                  width:
                    tableData.length > 14
                      ? "100px"
                      : 82 / tableData.length + 2 + "%",
                }}
              >
                {com.date}
              </div>
            ))}
            <div
              className="sCurveTableHeaderItem"
              style={{ width: tableData.length > 14 ? "100px" : "10%" }}
            >
              합계
            </div>
          </div>
          <div className="sCurveTableBody">
            {fieldData.map((com, idx) => {
              return (
                <React.Fragment key={idx}>
                  <div
                    className="sCurveTableBodyCol"
                    style={{
                      backgroundColor: idx % 2 !== 0 && "rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <div
                      className="sCurveTableBodyItem"
                      style={{
                        width: tableData.length > 14 ? "100px" : "8%",
                        fontWeight: "bold",
                      }}
                    >
                      {com.name}
                    </div>
                    {tableData.map((com1, idx) => (
                      <div
                        key={idx}
                        className="sCurveTableBodyItem"
                        style={{
                          width:
                            tableData.length > 14
                              ? "100px"
                              : 82 / tableData.length + 2 + "%",
                          fontWeight: com.field.includes("diff") && "bold",
                          color: Number(tableContent(com, com1)) < 0 && "red",
                        }}
                      >
                        {tableContent(com, com1)}
                      </div>
                    ))}
                    <div
                      className="sCurveTableBodyItem"
                      style={{
                        width: tableData.length > 14 ? "100px" : "10%",
                        fontWeight: "bold",
                      }}
                    >
                      {com.field.includes("diff")
                        ? "-"
                        : com.field === "plan"
                        ? tableData[tableData.length - 1]["c_plan"].toFixed(2)
                        : com.field === "act"
                        ? tableData
                            .find(
                              (com) => com.date === moment().format("YY년 MM월")
                            )
                            .c_act.toFixed(2)
                        : "-"}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )} */
