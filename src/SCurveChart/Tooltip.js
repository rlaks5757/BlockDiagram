import React from "react";

const Tooltip = (props) => {
  const { points } = props;

  console.log(points[0].point);
  return (
    <div>
      {points.map((com, idx) => {
        return (
          <div key={idx}>
            {com.point.category +
              " " +
              com.point.options.name +
              ": " +
              com.point.dataItem.toFixed(2)}
          </div>
        );
      })}
    </div>
  );
};

export default Tooltip;
