/*  

This code is based on following convention:

https://github.com/bumbeishvili/d3-coding-conventions

*/

function renderChart(params) {

  // exposed variables
  var attrs = {
    svgWidth: 1000,
    svgHeight: 600,
    marginTop: 20,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 50,
    container: 'body',
    data: null,
    hierarchyData: null,
    nodeData: null,
    colorData: null,
    node: {
      textFont: "Helvetica",
      textSize: "10pt",
      width: 120,
      height: 50,
      fill: "#E5E5E5",
      stroke: "#525E64",
      strokeWidth: 1,
      text: "#525E64",
      margin: 8
    }
  };

  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })

  //innerFunctions which will update visuals
  var updateData;

  //main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;
      attrs.node.heightWithMargin = attrs.node.height + attrs.node.margin;
      attrs.node.widthWithMargin = attrs.node.width + attrs.node.margin;


      mapColors();
      //drawing containers
      var container = d3.select(this);

      //add node element to container 
      d3.selection.prototype.addNode = function (isCenterNode = false, isVertical = false, isHorizontal = false) {


        var container = this;
        var node = container.patternify({ tag: 'g', selector: 'node', data: d => [d] })

        var rects = node.patternify({ tag: 'rect', selector: 'node-rect', data: d => [d] })
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", attrs.node.width)
          .attr("height", attrs.node.height)
          .attr("stroke", attrs.node.stroke)
          .attr("stroke-width", attrs.node.strokeWidth)
          .attr("fill", d => d.color != undefined ? d.color : attrs.node.fill)


        var texts = node.patternify({ tag: 'text', selector: 'node-text', data: d => [d] })
          .text(function (d) {

            if (isCenterNode) {
              var res = attrs.nodeData.filter(n => n.vertical == d.vertical && n.horizontal == d.horizontal)[0]
              d.name = (res == null ? "" : res.name)
            }
            return d.name;
          })
          .attr("fill", d => attrs.node.text)
          .style("font-size", attrs.node.textSize)
          .style("font-family", attrs.colorData.filter(c => c.key == "font-family")[0] != null ? attrs.colorData.filter(c => c.key == "font-family")[0].value : attrs.node.textFont)
          .style("font-style", d => d.fontStyle == null ? "default" : d.fontStyle)
          .attr("dy", "0.45em")
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", "middle")
          .attr("y", d => d.name.length > 20 ? 15 : attrs.node.height / 2)
          .attr("x", d => attrs.node.width / 2)
          .each(function (d) {
            wrap(this, d);
          });



        return selection;
      }

      var dimensions = getSvgDimensions();

      //add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")

      //add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');


      //------------------------------------------------- empty root node 
      var emptyRoot = chart.patternify({ tag: 'g', selector: 'empty-root', data: [attrs.hierarchyData[0]] });
      emptyRoot.addNode()

      //------------------------------------------------- vertical nodes
      var verticalRoot = chart.patternify({ tag: 'g', selector: 'vertical-root', data: [attrs.hierarchyData[3]] })
        .attr('transform', 'translate(' + 0 + ',' + attrs.node.heightWithMargin + ')');

      verticalRoot.addNode()


      var verticalGroup = verticalRoot.patternify({ tag: 'g', selector: 'vertical-group', data: function (d) { return copiedArray(d) } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })

      verticalGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + 0 + ',' + (calcPrevNodesNumber(d.mates, i) * attrs.node.heightWithMargin) + ')');

      verticalGroup.addNode(false, true, false)



      var verticalSubGroup = verticalGroup.patternify({ tag: 'g', selector: 'vertical-sub-group', data: function (d) { return copiedArray(d) } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })
      verticalSubGroup.addNode(false, true, false)

      verticalSubGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + 0 + ',' + (calcPrevNodesNumber(d.mates, i) * attrs.node.heightWithMargin) + ')')



      var verticalSubSubGroup = verticalSubGroup.patternify({ tag: 'g', selector: 'vertical-sub-sub-group', data: function (d) { return d.children != null ? d.children : [] } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })
      verticalSubSubGroup.addNode(false, true, false)

      verticalSubSubGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + 0 + ',' + (i + 1) * attrs.node.heightWithMargin + ')')



      // ---------------------------------------------  horizontal nodes 
      var horizontalRoot = chart.patternify({ tag: 'g', selector: 'horizontal-root', data: [attrs.hierarchyData[1]] })
        .attr('transform', 'translate(' + attrs.node.widthWithMargin + ',' + 0 + ')');
      horizontalRoot.addNode()

      var horizontalGroup = horizontalRoot.patternify({ tag: 'g', selector: 'horizontal-group', data: function (d) { return copiedArray(d) } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })
      horizontalGroup.addNode(false, false, true)

      horizontalGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + (calcPrevNodesNumber(d.mates, i) * attrs.node.widthWithMargin) + ',' + 0 + ')')



      var horizontalSubGroup = horizontalGroup.patternify({ tag: 'g', selector: 'horizontal-sub-group', data: function (d) { return copiedArray(d) } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })
      horizontalSubGroup.addNode(false, false, true)

      horizontalSubGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + (calcPrevNodesNumber(d.mates, i) * attrs.node.widthWithMargin)+ ',' + 0 + ')')



      var horizontalSubSubGroup = horizontalSubGroup.patternify({ tag: 'g', selector: 'horizontal-sub-sub-group', data: function (d) { return d.children != null ? d.children : [] } })
        .style("visibility", function (d) {
          return !d.parentIsOpened ? "hidden" : "visible";
        })
      horizontalSubSubGroup.addNode(false, false, true)

      horizontalSubSubGroup
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + (i + 1) * attrs.node.widthWithMargin + ',' + 0 + ')')




      //-------------------------------------------- central nodes
      var centerGroup = chart.patternify({ tag: 'g', selector: 'center-group' })
      centerGroup
        .transition()
        .duration(1000)
        .attr('transform', 'translate(' + attrs.node.widthWithMargin + ',' + attrs.node.heightWithMargin + ')')

      var centerVertical = centerGroup.patternify({ tag: 'g', selector: 'center-vertical-group', data: function () { return getOpenedNodes().vertical } })
      centerVertical
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + 0 + ',' + (i * attrs.node.heightWithMargin) + ')')


      var centerHorizontal = centerVertical.patternify({ tag: 'g', selector: 'center-horizontal-group', data: function (d) { return getCouples(d) } })
      centerHorizontal
        .transition()
        .duration(1000)
        .attr('transform', (d, i) => 'translate(' + i * attrs.node.widthWithMargin + ',' + 0 + ')')

      centerHorizontal.addNode(true, false, false)





      // cursor 
      d3.selectAll('.node')
        .style("cursor", d => d.children != null ? "pointer" : "default")


      // -------------------------------------- events --------------------------------------------- 
      d3.selectAll('.node').filter(d => d.children != null)
        .on("click", function (d) {
          if (d.isopened) { // close 
            d.isopened = !d.isopened
            //  subGroups  
            d.children.map(function (n) {
              n.parentIsOpened = d.isopened
              n.isopened = d.isopened
              //subsubgroup
              if (n.children != null) {
                n.children.map(function (s) {
                  s.parentIsOpened = d.isopened
                  s.isopened = d.isopened
                  if (s.children != null) {
                    s.children.map(function (ss) {
                      ss.parentIsOpened = s.isopened
                    })
                  }

                })
              }
            })
          } else { //open
            d.isopened = !d.isopened
            d.children.map(function (n) {
              n.parentIsOpened = d.isopened
            })
          }
          updateData();
        })

      d3.selectAll('.center-horizontal-group')
        .on("mouseover", function (d) {

          var transform = this.attributes[1].value
          var position = {
            x: +transform.substring(transform.indexOf('(') + 1, transform.indexOf(')')).split(',')[0],
            y: +transform.substring(transform.indexOf('(') + 1, transform.indexOf(')')).split(',')[1]
          }

          d3.selectAll('.node').filter(n => ((n.vertical == null && n.name != d.vertical) && (n.horizontal == null && n.name != d.horizontal))
            || ((n.vertical != null && n.vertical !== d.vertical) && (n.horizontal != null && n.horizontal !== d.horizontal)))
            .transition()
            .duration(300)
            .attr('opacity', 0.1)


        })
        .on("mouseout", function (d) {
          d3.selectAll('.node')
            .transition()
            .duration(300)
            .attr('opacity', 1)
        })

      // smoothly handle data updating
      updateData = function () {
        main.run()
      }
      //#########################################  UTIL FUNCS ##################################


      function debug() {
        if (attrs.isDebug) {
          //stringify func
          var stringified = scope + "";

          // parse variable names
          var groupVariables = stringified
            //match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //get xxx
            .map(v => v[0].trim())

          //assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }

      debug();

      function wrap(element, data) {
        var text = d3.select(element)
        text.each(function () {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("class", "text-ts-span").attr("x", x).attr("y", y).attr("dy", dy + "em")
          maxWidth = 0;
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));

            if (tspan.node().getComputedTextLength() > maxWidth) {
              maxWidth = tspan.node().getComputedTextLength();
            }

            if (tspan.node().getComputedTextLength() > attrs.node.width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                .attr("class", "text-ts-span")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
          }

        });
      }

      function calcPrevNodesNumber(arr, index) {
        var counter = 1;
        arr.map(function (d, i) {
          if (i < index) {
            counter++;

            if (d.isopened && d.children != null) {
              counter += d.children.length

              d.children.map(function (s) {
                if (s.isopened && s.children != null) {
                  counter += s.children.length;
                }
              })
            }


          }
        })

        return counter;
      }

      function copiedArray(d) {

        if (d.children != null) {
          d.children.map(function (s) {
            s.mates = d.children;
            return d;
          })
          return d.children
        }
        return [];

      }

      function getSvgDimensions() {
        var verticalOpenedNodesNumber = 2;
        var horizontalOpenedNodesNumber = 2;
        var verticalRootNode = attrs.hierarchyData[3];
        var horizontalRootNode = attrs.hierarchyData[1]


        if (verticalRootNode.isopened) {
          verticalOpenedNodesNumber += verticalRootNode.children.length;
          verticalRootNode.children.map(function (d) {
            if (d.isopened && d.children != null) {
              verticalOpenedNodesNumber += d.children.length

              d.children.map(function (s) {
                if (s.isopened && s.children != null) {
                  verticalOpenedNodesNumber += s.children.length;
                }
              })
            }
          })
        }

        if (horizontalRootNode.isopened) {
          horizontalOpenedNodesNumber += horizontalRootNode.children.length;
          horizontalRootNode.children.map(function (d) {
            if (d.isopened && d.children != null) {
              horizontalOpenedNodesNumber += d.children.length

              d.children.map(function (s) {
                if (s.isopened && s.children != null) {
                  horizontalOpenedNodesNumber += s.children.length;
                }
              })
            }
          })
        }

        return {
          height: verticalOpenedNodesNumber * attrs.node.heightWithMargin + attrs.marginTop,
          width: horizontalOpenedNodesNumber * attrs.node.widthWithMargin + attrs.marginLeft
        }
      }

      function getOpenedNodes() {
        var openedVerticalNodes = [];
        var openedHorizontalNodes = [];

        var verticalRootNode = attrs.hierarchyData[3];
        var horizontalRootNode = attrs.hierarchyData[1]

        if (verticalRootNode.isopened) {
          openedVerticalNodes.push(verticalRootNode.name)

          verticalRootNode.children.map(function (d) {
            openedVerticalNodes.push(d.name)
            if (d.isopened && d.children != null) {
              d.children.map(function (s) {
                openedVerticalNodes.push(s.name)
                if (s.isopened && s.children != null) {
                  s.children.map(function (ss) {
                    openedVerticalNodes.push(ss.name)
                  })
                }
              })
            }
          })
        } else {
          openedVerticalNodes.push(verticalRootNode.name)
        }

        if (horizontalRootNode.isopened) {
          openedHorizontalNodes.push(horizontalRootNode.name)

          horizontalRootNode.children.map(function (d) {
            openedHorizontalNodes.push(d.name)
            if (d.isopened && d.children != null) {
              d.children.map(function (s) {
                openedHorizontalNodes.push(s.name)
                if (s.isopened && s.children != null) {
                  s.children.map(function (ss) {
                    openedHorizontalNodes.push(ss.name)
                  })
                }
              })
            }
          })
        } else {
          openedHorizontalNodes.push(horizontalRootNode.name)
        }

        return {
          vertical: openedVerticalNodes,
          horizontal: openedHorizontalNodes
        }

      }

      function getCouples(d) {
        var horizontal = getOpenedNodes().horizontal;
        var result = horizontal.map(function (s) {
          return {
            vertical: d,
            horizontal: s
          }
        })
        return result;
      }


      function mapColors() {
        var colors = attrs.colorData;

        var verticalRootNode = attrs.hierarchyData[3];
        var horizontalRootNode = attrs.hierarchyData[1]

        verticalRootNode.children.map(function (d, i) {
          d.color = getColor(d.name, null, null, true)
          if (d.children != null) {
            d.children.map(function (s) {
              s.color = getColor(s.name, d.name, null, true)
              s.fontStyle = "italic"
              if (s.children != null) {
                s.children.map(function (ss) {
                  ss.color = getColor(ss.name, s.name, d.name, true)
                  ss.fontStyle = "italic"
                })
              }
            })
          }
        })


        horizontalRootNode.children.map(function (d, i) {
          d.color = getColor(d.name, null, null, false)
          if (d.children != null) {
            d.children.map(function (s) {
              s.color = getColor(s.name, d.name, null, false)
              s.fontStyle = "italic"
              if (s.children != null) {
                s.children.map(function (ss) {
                  ss.color = getColor(ss.name, s.name, d.name, false)
                  ss.fontStyle = "italic"
                })
              }
            })
          }

        })

        attrs.hierarchyData[3] = verticalRootNode;
        attrs.hierarchyData[1] = horizontalRootNode;

      }

      function getColor(nodeName, parentName, grandName, isVertical) {
        var colors = attrs.colorData;
        var nodeColor = colors.filter(n => n.key == nodeName)[0];

        if (nodeColor != undefined) {
          return nodeColor.value;
        }
        else {
          var parentColor = parentName != undefined ? colors.filter(n => n.key == parentName)[0] : null;
          if (parentColor != undefined) {
            return parentColor.value
          } else {
            var grandColor = grandName != undefined ? colors.filter(n => n.key == grandName)[0] : null;
            if (grandColor != undefined) {
              return grandColor.value
            } else {
              if (isVertical) {
                return attrs.node.fill
              } else {
                return attrs.node.text
              }
            }
          }
        }
      }

      // function getGroupTransformPosition(element) {
      //   var transform = element.attributes[1].value
      //   var position = {
      //     x: +transform.substring(transform.indexOf('(') + 1, transform.indexOf(')')).split(',')[0],
      //     y: +transform.substring(transform.indexOf('(') + 1, transform.indexOf(')')).split(',')[1]
      //   }
      // }

    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // pattern in action
    var selection = container.selectAll('.' + selector).data(data)
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //dinamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //set attrs as property
  main.attrs = attrs;

  //debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
