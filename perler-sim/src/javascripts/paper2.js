(function() {
    window.loadCustomLibraries = function() {
  
      /*Map path's perimeter points into jsclipper format
      [[{X:30,Y:30},{X:130,Y:30},{X:130,Y:130},{X:30,Y:130}]]
       */
      var toClipperPoints;
      toClipperPoints = function(path, offset) {
        var points;
        if (offset == null) {
          offset = 1;
        }
        points = _.range(0, path.length, offset);
        points = _.map(points, function(i) {
          var p;
          p = path.getPointAt(i);
          return {
            X: p.x,
            Y: p.y
          };
        });
        return [points];
      };
      console.log('Loading custom libraries!');
      if (!paper.Item.prototype.setRampPoint) {
        paper.Item.prototype.setRampPoint = function() {};
      }
      paper.Path.Join = {
        square: ClipperLib.JoinType.jtSquare,
        round: ClipperLib.JoinType.jtRound,
        miter: ClipperLib.JoinType.jtMiter
      };
      paper.Path.Alignment = {
        interior: -1,
        centered: 0,
        exterior: 1
      };
      paper.CompoundPath.prototype.expand = function(o) {
        var children_paths, clipperStrokePath, co, cp, deltas, endType, i, j, joinType, offsetted_paths, p, result_paths, scale, segs;
        scale = 1000;
        endType = ClipperLib.EndType.etClosedPolygon;
        joinType = paper.Path.Join[o.joinType];
        deltas = [paper.Path.Alignment[o.strokeAlignment] * o.strokeOffset / 2.0];
        children_paths = _.map(this.children, function(c) {
          var cp;
          cp = toClipperPoints(c, 1);
          ClipperLib.JS.ScaleUpPaths(cp, scale);
          return cp;
        });
        co = new ClipperLib.ClipperOffset;
        offsetted_paths = new ClipperLib.Paths;
        _.each(deltas, function(d) {
          co.Clear();
          co.AddPaths(children_paths[0], joinType, endType);
          co.AddPaths(children_paths[1], joinType, endType);
          co.MiterLimit = 2;
          co.ArcTolerance = 0.25;
          co.Execute(offsetted_paths, d * scale);
        });
        if (offsetted_paths.length === 0) {
          return null;
        }
        result_paths = [];
        i = 0;
        while (i < offsetted_paths.length) {
          segs = [];
          clipperStrokePath = new paper.Path({
            closed: true
          });
          j = 0;
          while (j < offsetted_paths[i].length) {
            p = new paper.Point(offsetted_paths[i][j].X, offsetted_paths[i][j].Y);
            p = p.divide(scale);
            segs.push(p);
            j++;
          }
          clipperStrokePath.addSegments(segs);
          clipperStrokePath.set(o);
          result_paths.push(clipperStrokePath);
          i++;
        }
        if (result_paths.length === 1) {
          return result_paths[0];
        } else {
          cp = new paper.CompoundPath({
            children: result_paths
          });
          cp.set(o);
          return cp;
        }
      };
      paper.Path.prototype.expand = function(o) {
        var clipperStrokePath, co, cp, deltas, endType, i, j, joinType, offsetted_paths, p, paths, result_paths, scale, segs;
        endType = ClipperLib.EndType.etClosedPolygon;
        joinType = paper.Path.Join[o.joinType];
        deltas = [paper.Path.Alignment[o.strokeAlignment] * o.strokeOffset / 2.0];
        paths = toClipperPoints(this, 1);
        ClipperLib.JS.ScaleUpPaths(paths, scale = 1000);
        co = new ClipperLib.ClipperOffset;
        offsetted_paths = new ClipperLib.Paths;
        _.each(deltas, function(d) {
          co.Clear();
          co.AddPaths(paths, joinType, endType);
          co.MiterLimit = 2;
          co.ArcTolerance = 0.25;
          co.Execute(offsetted_paths, d * scale);
        });
        if (offsetted_paths.length === 0) {
          return null;
        }
        result_paths = [];
        i = 0;
        while (i < offsetted_paths.length) {
          segs = [];
          clipperStrokePath = new paper.Path({
            closed: true
          });
          j = 0;
          while (j < offsetted_paths[i].length) {
            p = new paper.Point(offsetted_paths[i][j].X, offsetted_paths[i][j].Y);
            p = p.divide(scale);
            segs.push(p);
            j++;
          }
          clipperStrokePath.addSegments(segs);
          clipperStrokePath.set(o);
          result_paths.push(clipperStrokePath);
          i++;
        }
        if (result_paths.length === 1) {
          return result_paths[0];
        } else {
          cp = new paper.CompoundPath({
            children: result_paths
          });
          cp.set(o);
          return cp;
        }
      };
    };
  
  }).call(this);