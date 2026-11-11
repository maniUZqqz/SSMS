(()=>{var qb=Object.create;var Hu=Object.defineProperty;var Xb=Object.getOwnPropertyDescriptor;var Yb=Object.getOwnPropertyNames;var Zb=Object.getPrototypeOf,Kb=Object.prototype.hasOwnProperty;var hm=e=>{throw TypeError(e)};var Jb=(e,t,n)=>t in e?Hu(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var Pn=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}};var Qb=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Yb(t))!Kb.call(e,r)&&r!==n&&Hu(e,r,{get:()=>t[r],enumerable:!(i=Xb(t,r))||i.enumerable});return e};var tx=(e,t,n)=>(n=e!=null?qb(Zb(e)):{},Qb(t||!e||!e.__esModule?Hu(n,"default",{value:e,enumerable:!0}):n,e));var um=(e,t,n)=>Jb(e,typeof t!="symbol"?t+"":t,n),fm=(e,t,n)=>t.has(e)||hm("Cannot "+n);var gc=(e,t,n)=>(fm(e,t,"read from private field"),n?n.call(e):t.get(e)),Wu=(e,t,n)=>t.has(e)?hm("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,n),$u=(e,t,n,i)=>(fm(e,t,"write to private field"),i?i.call(e,n):t.set(e,n),n);var Bd=Pn((LF,v_)=>{v_.exports=function(t){return t===0?"x":t===1?"y":t===2?"z":"c"+(t+1)}});var fs=Pn((DF,b_)=>{var AT=Bd();b_.exports=function(t){return n;function n(i,r){let s=r&&r.indent||0,o=r&&r.join!==void 0?r.join:`
`,a=Array(s+1).join(" "),c=[];for(let l=0;l<t;++l){let h=AT(l),u=l===0?"":a;c.push(u+i.replace(/{var}/g,h))}return c.join(o)}}});var E_=Pn((NF,Va)=>{var x_=fs();Va.exports=CT;Va.exports.generateCreateBodyFunctionBody=M_;Va.exports.getVectorCode=w_;Va.exports.getBodyCode=S_;function CT(e,t){let n=M_(e,t),{Body:i}=new Function(n)();return i}function M_(e,t){return`
${w_(e,t)}
${S_(e,t)}
return {Body: Body, Vector: Vector};
`}function S_(e){let t=x_(e),n=t("{var}",{join:", "});return`
function Body(${n}) {
  this.isPinned = false;
  this.pos = new Vector(${n});
  this.force = new Vector();
  this.velocity = new Vector();
  this.mass = 1;

  this.springCount = 0;
  this.springLength = 0;
}

Body.prototype.reset = function() {
  this.force.reset();
  this.springCount = 0;
  this.springLength = 0;
}

Body.prototype.setPosition = function (${n}) {
  ${t("this.pos.{var} = {var} || 0;",{indent:2})}
};`}function w_(e,t){let n=x_(e),i="";return t&&(i=`${n(`
   var v{var};
Object.defineProperty(this, '{var}', {
  set: function(v) { 
    if (!Number.isFinite(v)) throw new Error('Cannot set non-numbers to {var}');
    v{var} = v; 
  },
  get: function() { return v{var}; }
});`)}`),`function Vector(${n("{var}",{join:", "})}) {
  ${i}
    if (typeof arguments[0] === 'object') {
      // could be another vector
      let v = arguments[0];
      ${n('if (!Number.isFinite(v.{var})) throw new Error("Expected value is not a finite number at Vector constructor ({var})");',{indent:4})}
      ${n("this.{var} = v.{var};",{indent:4})}
    } else {
      ${n('this.{var} = typeof {var} === "number" ? {var} : 0;',{indent:4})}
    }
  }
  
  Vector.prototype.reset = function () {
    ${n("this.{var} = ",{join:""})}0;
  };`}});var L_=Pn((OF,Fr)=>{var zd=fs(),Or=Bd();Fr.exports=RT;Fr.exports.generateQuadTreeFunctionBody=T_;Fr.exports.getInsertStackCode=I_;Fr.exports.getQuadNodeCode=P_;Fr.exports.isSamePosition=A_;Fr.exports.getChildBodyCode=R_;Fr.exports.setChildBodyCode=C_;function RT(e){let t=T_(e);return new Function(t)()}function T_(e){let t=zd(e),n=Math.pow(2,e);return`
${I_()}
${P_(e)}
${A_(e)}
${R_(e)}
${C_(e)}

function createQuadTree(options, random) {
  options = options || {};
  options.gravity = typeof options.gravity === 'number' ? options.gravity : -1;
  options.theta = typeof options.theta === 'number' ? options.theta : 0.8;

  var gravity = options.gravity;
  var updateQueue = [];
  var insertStack = new InsertStack();
  var theta = options.theta;

  var nodesCache = [];
  var currentInCache = 0;
  var root = newNode();

  return {
    insertBodies: insertBodies,

    /**
     * Gets root node if it is present
     */
    getRoot: function() {
      return root;
    },

    updateBodyForce: update,

    options: function(newOptions) {
      if (newOptions) {
        if (typeof newOptions.gravity === 'number') {
          gravity = newOptions.gravity;
        }
        if (typeof newOptions.theta === 'number') {
          theta = newOptions.theta;
        }

        return this;
      }

      return {
        gravity: gravity,
        theta: theta
      };
    }
  };

  function newNode() {
    // To avoid pressure on GC we reuse nodes.
    var node = nodesCache[currentInCache];
    if (node) {
${o("      node.")}
      node.body = null;
      node.mass = ${t("node.mass_{var} = ",{join:""})}0;
      ${t("node.min_{var} = node.max_{var} = ",{join:""})}0;
    } else {
      node = new QuadNode();
      nodesCache[currentInCache] = node;
    }

    ++currentInCache;
    return node;
  }

  function update(sourceBody) {
    var queue = updateQueue;
    var v;
    ${t("var d{var};",{indent:4})}
    var r; 
    ${t("var f{var} = 0;",{indent:4})}
    var queueLength = 1;
    var shiftIdx = 0;
    var pushIdx = 1;

    queue[0] = root;

    while (queueLength) {
      var node = queue[shiftIdx];
      var body = node.body;

      queueLength -= 1;
      shiftIdx += 1;
      var differentBody = (body !== sourceBody);
      if (body && differentBody) {
        // If the current node is a leaf node (and it is not source body),
        // calculate the force exerted by the current node on body, and add this
        // amount to body's net force.
        ${t("d{var} = body.pos.{var} - sourceBody.pos.{var};",{indent:8})}
        r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});

        if (r === 0) {
          // Poor man's protection against zero distance.
          ${t("d{var} = (random.nextDouble() - 0.5) / 50;",{indent:10})}
          r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});
        }

        // This is standard gravitation force calculation but we divide
        // by r^3 to save two operations when normalizing force vector.
        v = gravity * body.mass * sourceBody.mass / (r * r * r);
        ${t("f{var} += v * d{var};",{indent:8})}
      } else if (differentBody) {
        // Otherwise, calculate the ratio s / r,  where s is the width of the region
        // represented by the internal node, and r is the distance between the body
        // and the node's center-of-mass
        ${t("d{var} = node.mass_{var} / node.mass - sourceBody.pos.{var};",{indent:8})}
        r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});

        if (r === 0) {
          // Sorry about code duplication. I don't want to create many functions
          // right away. Just want to see performance first.
          ${t("d{var} = (random.nextDouble() - 0.5) / 50;",{indent:10})}
          r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});
        }
        // If s / r < \u03B8, treat this internal node as a single body, and calculate the
        // force it exerts on sourceBody, and add this amount to sourceBody's net force.
        if ((node.max_${Or(0)} - node.min_${Or(0)}) / r < theta) {
          // in the if statement above we consider node's width only
          // because the region was made into square during tree creation.
          // Thus there is no difference between using width or height.
          v = gravity * node.mass * sourceBody.mass / (r * r * r);
          ${t("f{var} += v * d{var};",{indent:10})}
        } else {
          // Otherwise, run the procedure recursively on each of the current node's children.

          // I intentionally unfolded this loop, to save several CPU cycles.
${s()}
        }
      }
    }

    ${t("sourceBody.force.{var} += f{var};",{indent:4})}
  }

  function insertBodies(bodies) {
    ${t("var {var}min = Number.MAX_VALUE;",{indent:4})}
    ${t("var {var}max = Number.MIN_VALUE;",{indent:4})}
    var i = bodies.length;

    // To reduce quad tree depth we are looking for exact bounding box of all particles.
    while (i--) {
      var pos = bodies[i].pos;
      ${t("if (pos.{var} < {var}min) {var}min = pos.{var};",{indent:6})}
      ${t("if (pos.{var} > {var}max) {var}max = pos.{var};",{indent:6})}
    }

    // Makes the bounds square.
    var maxSideLength = -Infinity;
    ${t("if ({var}max - {var}min > maxSideLength) maxSideLength = {var}max - {var}min ;",{indent:4})}

    currentInCache = 0;
    root = newNode();
    ${t("root.min_{var} = {var}min;",{indent:4})}
    ${t("root.max_{var} = {var}min + maxSideLength;",{indent:4})}

    i = bodies.length - 1;
    if (i >= 0) {
      root.body = bodies[i];
    }
    while (i--) {
      insert(bodies[i], root);
    }
  }

  function insert(newBody) {
    insertStack.reset();
    insertStack.push(root, newBody);

    while (!insertStack.isEmpty()) {
      var stackItem = insertStack.pop();
      var node = stackItem.node;
      var body = stackItem.body;

      if (!node.body) {
        // This is internal node. Update the total mass of the node and center-of-mass.
        ${t("var {var} = body.pos.{var};",{indent:8})}
        node.mass += body.mass;
        ${t("node.mass_{var} += body.mass * {var};",{indent:8})}

        // Recursively insert the body in the appropriate quadrant.
        // But first find the appropriate quadrant.
        var quadIdx = 0; // Assume we are in the 0's quad.
        ${t("var min_{var} = node.min_{var};",{indent:8})}
        ${t("var max_{var} = (min_{var} + node.max_{var}) / 2;",{indent:8})}

${r(8)}

        var child = getChild(node, quadIdx);

        if (!child) {
          // The node is internal but this quadrant is not taken. Add
          // subnode to it.
          child = newNode();
          ${t("child.min_{var} = min_{var};",{indent:10})}
          ${t("child.max_{var} = max_{var};",{indent:10})}
          child.body = body;

          setChild(node, quadIdx, child);
        } else {
          // continue searching in this quadrant.
          insertStack.push(child, body);
        }
      } else {
        // We are trying to add to the leaf node.
        // We have to convert current leaf into internal node
        // and continue adding two nodes.
        var oldBody = node.body;
        node.body = null; // internal nodes do not cary bodies

        if (isSamePosition(oldBody.pos, body.pos)) {
          // Prevent infinite subdivision by bumping one node
          // anywhere in this quadrant
          var retriesCount = 3;
          do {
            var offset = random.nextDouble();
            ${t("var d{var} = (node.max_{var} - node.min_{var}) * offset;",{indent:12})}

            ${t("oldBody.pos.{var} = node.min_{var} + d{var};",{indent:12})}
            retriesCount -= 1;
            // Make sure we don't bump it out of the box. If we do, next iteration should fix it
          } while (retriesCount > 0 && isSamePosition(oldBody.pos, body.pos));

          if (retriesCount === 0 && isSamePosition(oldBody.pos, body.pos)) {
            // This is very bad, we ran out of precision.
            // if we do not return from the method we'll get into
            // infinite loop here. So we sacrifice correctness of layout, and keep the app running
            // Next layout iteration should get larger bounding box in the first step and fix this
            return;
          }
        }
        // Next iteration should subdivide node further.
        insertStack.push(node, oldBody);
        insertStack.push(node, body);
      }
    }
  }
}
return createQuadTree;

`;function r(a){let c=[],l=Array(a+1).join(" ");for(let h=0;h<e;++h)c.push(l+`if (${Or(h)} > max_${Or(h)}) {`),c.push(l+`  quadIdx = quadIdx + ${Math.pow(2,h)};`),c.push(l+`  min_${Or(h)} = max_${Or(h)};`),c.push(l+`  max_${Or(h)} = node.max_${Or(h)};`),c.push(l+"}");return c.join(`
`)}function s(){let a=Array(11).join(" "),c=[];for(let l=0;l<n;++l)c.push(a+`if (node.quad${l}) {`),c.push(a+`  queue[pushIdx] = node.quad${l};`),c.push(a+"  queueLength += 1;"),c.push(a+"  pushIdx += 1;"),c.push(a+"}");return c.join(`
`)}function o(a){let c=[];for(let l=0;l<n;++l)c.push(`${a}quad${l} = null;`);return c.join(`
`)}}function A_(e){let t=zd(e);return`
  function isSamePosition(point1, point2) {
    ${t("var d{var} = Math.abs(point1.{var} - point2.{var});",{indent:2})}
  
    return ${t("d{var} < 1e-8",{join:" && "})};
  }  
`}function C_(e){var t=Math.pow(2,e);return`
function setChild(node, idx, child) {
  ${n()}
}`;function n(){let i=[];for(let r=0;r<t;++r){let s=r===0?"  ":"  else ";i.push(`${s}if (idx === ${r}) node.quad${r} = child;`)}return i.join(`
`)}}function R_(e){return`function getChild(node, idx) {
${t()}
  return null;
}`;function t(){let n=[],i=Math.pow(2,e);for(let r=0;r<i;++r)n.push(`  if (idx === ${r}) return node.quad${r};`);return n.join(`
`)}}function P_(e){let t=zd(e),n=Math.pow(2,e);var i=`
function QuadNode() {
  // body stored inside this node. In quad tree only leaf nodes (by construction)
  // contain bodies:
  this.body = null;

  // Child nodes are stored in quads. Each quad is presented by number:
  // 0 | 1
  // -----
  // 2 | 3
${r("  this.")}

  // Total mass of current node
  this.mass = 0;

  // Center of mass coordinates
  ${t("this.mass_{var} = 0;",{indent:2})}

  // bounding box coordinates
  ${t("this.min_{var} = 0;",{indent:2})}
  ${t("this.max_{var} = 0;",{indent:2})}
}
`;return i;function r(s){let o=[];for(let a=0;a<n;++a)o.push(`${s}quad${a} = null;`);return o.join(`
`)}}function I_(){return`
/**
 * Our implementation of QuadTree is non-recursive to avoid GC hit
 * This data structure represent stack of elements
 * which we are trying to insert into quad tree.
 */
function InsertStack () {
    this.stack = [];
    this.popIdx = 0;
}

InsertStack.prototype = {
    isEmpty: function() {
        return this.popIdx === 0;
    },
    push: function (node, body) {
        var item = this.stack[this.popIdx];
        if (!item) {
            // we are trying to avoid memory pressure: create new element
            // only when absolutely necessary
            this.stack[this.popIdx] = new InsertStackElement(node, body);
        } else {
            item.node = node;
            item.body = body;
        }
        ++this.popIdx;
    },
    pop: function () {
        if (this.popIdx > 0) {
            return this.stack[--this.popIdx];
        }
    },
    reset: function () {
        this.popIdx = 0;
    }
};

function InsertStackElement(node, body) {
    this.node = node; // QuadTree node
    this.body = body; // physical body which needs to be inserted to node
}
`}});var N_=Pn((FF,Gd)=>{Gd.exports=IT;Gd.exports.generateFunctionBody=D_;var PT=fs();function IT(e){let t=D_(e);return new Function("bodies","settings","random",t)}function D_(e){let t=PT(e);return`
  var boundingBox = {
    ${t("min_{var}: 0, max_{var}: 0,",{indent:4})}
  };

  return {
    box: boundingBox,

    update: updateBoundingBox,

    reset: resetBoundingBox,

    getBestNewPosition: function (neighbors) {
      var ${t("base_{var} = 0",{join:", "})};

      if (neighbors.length) {
        for (var i = 0; i < neighbors.length; ++i) {
          let neighborPos = neighbors[i].pos;
          ${t("base_{var} += neighborPos.{var};",{indent:10})}
        }

        ${t("base_{var} /= neighbors.length;",{indent:8})}
      } else {
        ${t("base_{var} = (boundingBox.min_{var} + boundingBox.max_{var}) / 2;",{indent:8})}
      }

      var springLength = settings.springLength;
      return {
        ${t("{var}: base_{var} + (random.nextDouble() - 0.5) * springLength,",{indent:8})}
      };
    }
  };

  function updateBoundingBox() {
    var i = bodies.length;
    if (i === 0) return; // No bodies - no borders.

    ${t("var max_{var} = -Infinity;",{indent:4})}
    ${t("var min_{var} = Infinity;",{indent:4})}

    while(i--) {
      // this is O(n), it could be done faster with quadtree, if we check the root node bounds
      var bodyPos = bodies[i].pos;
      ${t("if (bodyPos.{var} < min_{var}) min_{var} = bodyPos.{var};",{indent:6})}
      ${t("if (bodyPos.{var} > max_{var}) max_{var} = bodyPos.{var};",{indent:6})}
    }

    ${t("boundingBox.min_{var} = min_{var};",{indent:4})}
    ${t("boundingBox.max_{var} = max_{var};",{indent:4})}
  }

  function resetBoundingBox() {
    ${t("boundingBox.min_{var} = boundingBox.max_{var} = 0;",{indent:4})}
  }
`}});var F_=Pn((UF,Vd)=>{var LT=fs();Vd.exports=DT;Vd.exports.generateCreateDragForceFunctionBody=O_;function DT(e){let t=O_(e);return new Function("options",t)}function O_(e){return`
  if (!Number.isFinite(options.dragCoefficient)) throw new Error('dragCoefficient is not a finite number');

  return {
    update: function(body) {
      ${LT(e)("body.force.{var} -= options.dragCoefficient * body.velocity.{var};",{indent:6})}
    }
  };
`}});var k_=Pn((kF,Hd)=>{var NT=fs();Hd.exports=OT;Hd.exports.generateCreateSpringForceFunctionBody=U_;function OT(e){let t=U_(e);return new Function("options","random",t)}function U_(e){let t=NT(e);return`
  if (!Number.isFinite(options.springCoefficient)) throw new Error('Spring coefficient is not a number');
  if (!Number.isFinite(options.springLength)) throw new Error('Spring length is not a number');

  return {
    /**
     * Updates forces acting on a spring
     */
    update: function (spring) {
      var body1 = spring.from;
      var body2 = spring.to;
      var length = spring.length < 0 ? options.springLength : spring.length;
      ${t("var d{var} = body2.pos.{var} - body1.pos.{var};",{indent:6})}
      var r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});

      if (r === 0) {
        ${t("d{var} = (random.nextDouble() - 0.5) / 50;",{indent:8})}
        r = Math.sqrt(${t("d{var} * d{var}",{join:" + "})});
      }

      var d = r - length;
      var coefficient = ((spring.coefficient > 0) ? spring.coefficient : options.springCoefficient) * d / r;

      ${t("body1.force.{var} += coefficient * d{var}",{indent:6})};
      body1.springCount += 1;
      body1.springLength += r;

      ${t("body2.force.{var} -= coefficient * d{var}",{indent:6})};
      body2.springCount += 1;
      body2.springLength += r;
    }
  };
`}});var z_=Pn((BF,Wd)=>{var FT=fs();Wd.exports=UT;Wd.exports.generateIntegratorFunctionBody=B_;function UT(e){let t=B_(e);return new Function("bodies","timeStep","adaptiveTimeStepWeight",t)}function B_(e){let t=FT(e);return`
  var length = bodies.length;
  if (length === 0) return 0;

  ${t("var d{var} = 0, t{var} = 0;",{indent:2})}

  for (var i = 0; i < length; ++i) {
    var body = bodies[i];
    if (body.isPinned) continue;

    if (adaptiveTimeStepWeight && body.springCount) {
      timeStep = (adaptiveTimeStepWeight * body.springLength/body.springCount);
    }

    var coeff = timeStep / body.mass;

    ${t("body.velocity.{var} += coeff * body.force.{var};",{indent:4})}
    ${t("var v{var} = body.velocity.{var};",{indent:4})}
    var v = Math.sqrt(${t("v{var} * v{var}",{join:" + "})});

    if (v > 1) {
      // We normalize it so that we move within timeStep range. 
      // for the case when v <= 1 - we let velocity to fade out.
      ${t("body.velocity.{var} = v{var} / v;",{indent:6})}
    }

    ${t("d{var} = timeStep * body.velocity.{var};",{indent:4})}

    ${t("body.pos.{var} += d{var};",{indent:4})}

    ${t("t{var} += Math.abs(d{var});",{indent:4})}
  }

  return (${t("t{var} * t{var}",{join:" + "})})/length;
`}});var V_=Pn((zF,G_)=>{G_.exports=kT;function kT(e,t,n,i){this.from=e,this.to=t,this.length=n,this.coefficient=i}});var $_=Pn((GF,W_)=>{W_.exports=H_;function H_(e,t){var n;if(e||(e={}),t){for(n in t)if(t.hasOwnProperty(n)){var i=e.hasOwnProperty(n),r=typeof t[n],s=!i||typeof e[n]!==r;s?e[n]=t[n]:r==="object"&&(e[n]=H_(e[n],t[n]))}}return e}});var $d=Pn((VF,j_)=>{"use strict";function BT(e){GT(e);let t=zT(e);return e.on=t.on,e.off=t.off,e.fire=t.fire,e}function zT(e){let t=Object.create(null);return{on:function(n,i,r){if(typeof i!="function")throw new Error("callback is expected to be a function");let s=t[n];return s||(s=t[n]=[]),s.push({callback:i,ctx:r}),e},off:function(n,i){if(typeof n>"u")return t=Object.create(null),e;if(t[n])if(typeof i!="function")delete t[n];else{let r=t[n];for(let s=0;s<r.length;++s)r[s].callback===i&&r.splice(s,1)}return e},fire:function(n){let i=t[n];if(!i)return e;let r;arguments.length>1&&(r=Array.prototype.slice.call(arguments,1));for(let s=0;s<i.length;++s){let o=i[s];o.callback.apply(o.ctx,r)}return e}}}function GT(e){if(!e)throw new Error("Eventify cannot use falsy object as events subject");let t=["on","fire","off"];for(let n=0;n<t.length;++n)if(e.hasOwnProperty(t[n]))throw new Error("Subject cannot be eventified, since it already has property '"+t[n]+"'")}j_.exports=BT});var X_=Pn((HF,kh)=>{kh.exports=jd;kh.exports.random=jd,kh.exports.randomIterator=$T;function jd(e){var t=typeof e=="number"?e:+new Date;return new ds(t)}function ds(e){this.seed=e}ds.prototype.next=WT;ds.prototype.nextDouble=qd;ds.prototype.uniform=qd;ds.prototype.gaussian=VT;ds.prototype.random=qd;function VT(){var e,t,n;do t=this.nextDouble()*2-1,n=this.nextDouble()*2-1,e=t*t+n*n;while(e>=1||e===0);return t*Math.sqrt(-2*Math.log(e)/e)}ds.prototype.levy=HT;function HT(){var e=1.5,t=Math.pow(q_(1+e)*Math.sin(Math.PI*e/2)/(q_((1+e)/2)*e*Math.pow(2,(e-1)/2)),1/e);return this.gaussian()*t/Math.pow(Math.abs(this.gaussian()),1/e)}function q_(e){return Math.sqrt(2*Math.PI/e)*Math.pow(1/Math.E*(e+1/(12*e-1/(10*e))),e)}function qd(){var e=this.seed;return e=e+2127912214+(e<<12)&4294967295,e=(e^3345072700^e>>>19)&4294967295,e=e+374761393+(e<<5)&4294967295,e=(e+3550635116^e<<9)&4294967295,e=e+4251993797+(e<<3)&4294967295,e=(e^3042594569^e>>>16)&4294967295,this.seed=e,(e&268435455)/268435456}function WT(e){return Math.floor(this.nextDouble()*e)}function $T(e,t){var n=t||jd();if(typeof n.next!="function")throw new Error("customRandom does not match expected API: next() function is missing");return{forEach:r,shuffle:i};function i(){var s,o,a;for(s=e.length-1;s>0;--s)o=n.next(s+1),a=e[o],e[o]=e[s],e[s]=a;return e}function r(s){var o,a,c;for(o=e.length-1;o>0;--o)a=n.next(o+1),c=e[a],e[a]=e[o],e[o]=c,s(c);e.length&&s(e[0])}}});var Xd=Pn((WF,Z_)=>{Z_.exports=JT;var jT=E_(),qT=L_(),XT=N_(),YT=F_(),ZT=k_(),KT=z_(),Y_={};function JT(e){var t=V_(),n=$_(),i=$d();if(e){if(e.springCoeff!==void 0)throw new Error("springCoeff was renamed to springCoefficient");if(e.dragCoeff!==void 0)throw new Error("dragCoeff was renamed to dragCoefficient")}e=n(e,{springLength:10,springCoefficient:.8,gravity:-12,theta:.8,dragCoefficient:.9,timeStep:.5,adaptiveTimeStepWeight:0,dimensions:2,debug:!1});var r=Y_[e.dimensions];if(!r){var s=e.dimensions;r={Body:jT(s,e.debug),createQuadTree:qT(s),createBounds:XT(s),createDragForce:YT(s),createSpringForce:ZT(s),integrate:KT(s)},Y_[s]=r}var o=r.Body,a=r.createQuadTree,c=r.createBounds,l=r.createDragForce,h=r.createSpringForce,u=r.integrate,d=I=>new o(I),f=X_().random(42),p=[],_=[],g=a(e,f),m=c(p,e,f),y=h(e,f),x=l(e),b=0,S=[],w=new Map,v=0;P("nbody",N),P("spring",T);var M={bodies:p,quadTree:g,springs:_,settings:e,addForce:P,removeForce:k,getForces:C,step:function(){for(var I=0;I<S.length;++I)S[I](v);var B=u(p,e.timeStep,e.adaptiveTimeStepWeight);return v+=1,B},addBody:function(I){if(!I)throw new Error("Body is required");return p.push(I),I},addBodyAt:function(I){if(!I)throw new Error("Body position is required");var B=d(I);return p.push(B),B},removeBody:function(I){if(I){var B=p.indexOf(I);if(!(B<0))return p.splice(B,1),p.length===0&&m.reset(),!0}},addSpring:function(I,B,D,j){if(!I||!B)throw new Error("Cannot add null spring to force simulator");typeof D!="number"&&(D=-1);var H=new t(I,B,D,j>=0?j:-1);return _.push(H),H},getTotalMovement:function(){return b},removeSpring:function(I){if(I){var B=_.indexOf(I);if(B>-1)return _.splice(B,1),!0}},getBestNewBodyPosition:function(I){return m.getBestNewPosition(I)},getBBox:U,getBoundingBox:U,invalidateBBox:function(){console.warn("invalidateBBox() is deprecated, bounds always recomputed on `getBBox()` call")},gravity:function(I){return I!==void 0?(e.gravity=I,g.options({gravity:I}),this):e.gravity},theta:function(I){return I!==void 0?(e.theta=I,g.options({theta:I}),this):e.theta},random:f};return QT(e,M),i(M),M;function U(){return m.update(),m.box}function P(I,B){if(w.has(I))throw new Error("Force "+I+" is already added");w.set(I,B),S.push(B)}function k(I){var B=S.indexOf(w.get(I));B<0||(S.splice(B,1),w.delete(I))}function C(){return w}function N(){if(p.length!==0){g.insertBodies(p);for(var I=p.length;I--;){var B=p[I];B.isPinned||(B.reset(),g.updateBodyForce(B),x.update(B))}}}function T(){for(var I=_.length;I--;)y.update(_[I])}}function QT(e,t){for(var n in e)tA(e,t,n)}function tA(e,t,n){if(e.hasOwnProperty(n)&&typeof t[n]!="function"){var i=Number.isFinite(e[n]);i?t[n]=function(r){if(r!==void 0){if(!Number.isFinite(r))throw new Error("Value of "+n+" should be a valid number.");return e[n]=r,t}return e[n]}:t[n]=function(r){return r!==void 0?(e[n]=r,t):e[n]}}}});var K_=Pn(($F,Yd)=>{Yd.exports=nA;Yd.exports.simulator=Xd();var eA=$d();function nA(e,t){if(!e)throw new Error("Graph structure cannot be undefined");var n=t&&t.createSimulator||Xd(),i=n(t);if(Array.isArray(t))throw new Error("Physics settings is expected to be an object");var r=e.version>19?N:C;t&&typeof t.nodeMass=="function"&&(r=t.nodeMass);var s=new Map,o={},a=0,c=i.settings.springTransform||iA;x(),g();var l=!1,h={step:function(){if(a===0)return u(!0),!0;var T=i.step();h.lastMove=T,h.fire("step");var I=T/a,B=I<=.01;return u(B),B},getNodePosition:function(T){return k(T).pos},setNodePosition:function(T){var I=k(T);I.setPosition.apply(I,Array.prototype.slice.call(arguments,1))},getLinkPosition:function(T){var I=o[T];if(I)return{from:I.from.pos,to:I.to.pos}},getGraphRect:function(){return i.getBBox()},forEachBody:d,pinNode:function(T,I){var B=k(T.id);B.isPinned=!!I},isNodePinned:function(T){return k(T.id).isPinned},dispose:function(){e.off("changed",y),h.fire("disposed")},getBody:_,getSpring:p,getForceVectorLength:f,simulator:i,graph:e,lastMove:0};return eA(h),h;function u(T){l!==T&&(l=T,m(T))}function d(T){s.forEach(T)}function f(){var T=0,I=0;return d(function(B){T+=Math.abs(B.force.x),I+=Math.abs(B.force.y)}),Math.sqrt(T*T+I*I)}function p(T,I){var B;if(I===void 0)typeof T!="object"?B=T:B=T.id;else{var D=e.hasLink(T,I);if(!D)return;B=D.id}return o[B]}function _(T){return s.get(T)}function g(){e.on("changed",y)}function m(T){h.fire("stable",T)}function y(T){for(var I=0;I<T.length;++I){var B=T[I];B.changeType==="add"?(B.node&&b(B.node.id),B.link&&w(B.link)):B.changeType==="remove"&&(B.node&&S(B.node),B.link&&v(B.link))}a=e.getNodesCount()}function x(){a=0,e.forEachNode(function(T){b(T.id),a+=1}),e.forEachLink(w)}function b(T){var I=s.get(T);if(!I){var B=e.getNode(T);if(!B)throw new Error("initBody() was called with unknown node id");var D=B.position;if(!D){var j=M(B);D=i.getBestNewBodyPosition(j)}I=i.addBodyAt(D),I.id=T,s.set(T,I),U(T),P(B)&&(I.isPinned=!0)}}function S(T){var I=T.id,B=s.get(I);B&&(s.delete(I),i.removeBody(B))}function w(T){U(T.fromId),U(T.toId);var I=s.get(T.fromId),B=s.get(T.toId),D=i.addSpring(I,B,T.length);c(T,D),o[T.id]=D}function v(T){var I=o[T.id];if(I){var B=e.getNode(T.fromId),D=e.getNode(T.toId);B&&U(B.id),D&&U(D.id),delete o[T.id],i.removeSpring(I)}}function M(T){var I=[];if(!T.links)return I;for(var B=Math.min(T.links.length,2),D=0;D<B;++D){var j=T.links[D],H=j.fromId!==T.id?s.get(j.fromId):s.get(j.toId);H&&H.pos&&I.push(H)}return I}function U(T){var I=s.get(T);if(I.mass=r(T),Number.isNaN(I.mass))throw new Error("Node mass should be a number")}function P(T){return T&&(T.isPinned||T.data&&T.data.isPinned)}function k(T){var I=s.get(T);return I||(b(T),I=s.get(T)),I}function C(T){var I=e.getLinks(T);return I?1+I.length/3:1}function N(T){var I=e.getLinks(T);return I?1+I.size/3:1}}function iA(){}});var ke={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ni={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Jm=0,Tf=1,Qm=2;var xa=1,tg=2,co=3,Ir=0,rn=1,Ii=2,nr=0,lo=1,Af=2,Cf=3,Rf=4,eg=5;var as=100,ng=101,ig=102,rg=103,sg=104,og=200,ag=201,cg=202,lg=203,Pf=204,If=205,hg=206,ug=207,fg=208,dg=209,pg=210,mg=211,gg=212,_g=213,yg=214,jc=0,qc=1,Xc=2,js=3,Yc=4,Zc=5,Kc=6,Jc=7,Dl=0,vg=1,bg=2,Li=0,Lf=1,Df=2,Nf=3,Of=4,Ff=5,Uf=6,kf=7;var Bf=300,cs=301,ho=302,Nl=303,Ol=304,Qc=1e3,Ti=1001,tl=1002,Ke=1003,xg=1004;var Ma=1005;var Sn=1006,Fl=1007;var ir=1008;var Ln=1009,zf=1010,Gf=1011,uo=1012,Ul=1013,mi=1014,ii=1015,qn=1016,kl=1017,Bl=1018,ls=1020,Vf=35902,Hf=35899,Wf=1021,$f=1022,gi=1023,Ji=1026,rr=1027,zl=1028,Gl=1029,Lr=1030,Vl=1031;var Hl=1033,Sa=33776,wa=33777,Ea=33778,Ta=33779,Wl=35840,$l=35841,jl=35842,ql=35843,Xl=36196,Yl=37492,Zl=37496,Kl=37488,Jl=37489,Aa=37490,Ql=37491,th=37808,eh=37809,nh=37810,ih=37811,rh=37812,sh=37813,oh=37814,ah=37815,ch=37816,lh=37817,hh=37818,uh=37819,fh=37820,dh=37821,ph=36492,mh=36494,gh=36495,_h=36283,yh=36284,Ca=36285,vh=36286;var Yo=2300,el=2301,Hc=2302,yf=2303,vf=2400,bf=2401,xf=2402;var Mg=3200;var bh=0,Sg=1,sr="",We="srgb",Zo="srgb-linear",Ko="linear",_e="srgb";var Wc=7680;var wg=519,Eg=512,Tg=513,Ag=514,jf=515,Cg=516,Rg=517,qf=518,Xf=519,Yf=35044;var Zf="300 es",ti=2e3,qs=2001;function ex(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function nx(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Xs(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function Pg(){let e=Xs("canvas");return e.style.display="block",e}var dm={},Ys=null;function Jo(...e){let t="THREE."+e.shift();Ys?Ys("log",t,...e):console.log(t,...e)}function Ig(e){let t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){let n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Gt(...e){e=Ig(e);let t="THREE."+e.shift();if(Ys)Ys("warn",t,...e);else{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function qt(...e){e=Ig(e);let t="THREE."+e.shift();if(Ys)Ys("error",t,...e);else{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Wo(...e){let t=e.join(" ");t in dm||(dm[t]=!0,Gt(...e))}function Lg(e,t,n){return new Promise(function(i,r){function s(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:r();break;case e.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}var Dg={[jc]:jc,[Xc]:Kc,[Yc]:Yc,[js]:Zc,[qc]:qc,[Kc]:Xc,[Jc]:Jc,[Zc]:js},di=class{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){let i=this._listeners;if(i===void 0)return;let r=i[t];if(r!==void 0){let s=r.indexOf(n);s!==-1&&r.splice(s,1)}}dispatchEvent(t){let n=this._listeners;if(n===void 0)return;let i=n[t.type];if(i!==void 0){t.target=this;let r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}},hn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],pm=1234567,$o=Math.PI/180,Zs=180/Math.PI;function Dr(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(hn[e&255]+hn[e>>8&255]+hn[e>>16&255]+hn[e>>24&255]+"-"+hn[t&255]+hn[t>>8&255]+"-"+hn[t>>16&15|64]+hn[t>>24&255]+"-"+hn[n&63|128]+hn[n>>8&255]+"-"+hn[n>>16&255]+hn[n>>24&255]+hn[i&255]+hn[i>>8&255]+hn[i>>16&255]+hn[i>>24&255]).toLowerCase()}function ee(e,t,n){return Math.max(t,Math.min(n,e))}function Kf(e,t){return(e%t+t)%t}function ix(e,t,n,i,r){return i+(e-t)*(r-i)/(n-t)}function rx(e,t,n){return e!==t?(n-e)/(t-e):0}function jo(e,t,n){return(1-n)*e+n*t}function sx(e,t,n,i){return jo(e,t,1-Math.exp(-n*i))}function ox(e,t=1){return t-Math.abs(Kf(e,t*2)-t)}function ax(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function cx(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function lx(e,t){return e+Math.floor(Math.random()*(t-e+1))}function hx(e,t){return e+Math.random()*(t-e)}function ux(e){return e*(.5-Math.random())}function fx(e){e!==void 0&&(pm=e);let t=pm+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function dx(e){return e*$o}function px(e){return e*Zs}function mx(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function gx(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function Jf(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function _x(e,t,n,i,r){let s=Math.cos,o=Math.sin,a=s(n/2),c=o(n/2),l=s((t+i)/2),h=o((t+i)/2),u=s((t-i)/2),d=o((t-i)/2),f=s((i-t)/2),p=o((i-t)/2);switch(r){case"XYX":e.set(a*h,c*u,c*d,a*l);break;case"YZY":e.set(c*d,a*h,c*u,a*l);break;case"ZXZ":e.set(c*u,c*d,a*h,a*l);break;case"XZX":e.set(a*h,c*p,c*f,a*l);break;case"YXY":e.set(c*f,a*h,c*p,a*l);break;case"ZYZ":e.set(c*p,c*f,a*h,a*l);break;default:Gt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function xh(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Qf(e,t){if(t.constructor===Float32Array)return e;let n=xh(t);if(n===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(e/n,-1)}function td(e,t){if(t.constructor===Float32Array)return e;let n=xh(t);if(n===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(e*n)}var be={DEG2RAD:$o,RAD2DEG:Zs,generateUUID:Dr,clamp:ee,euclideanModulo:Kf,mapLinear:ix,inverseLerp:rx,lerp:jo,damp:sx,pingpong:ox,smoothstep:ax,smootherstep:cx,randInt:lx,randFloat:hx,randFloatSpread:ux,seededRandom:fx,degToRad:dx,radToDeg:px,isPowerOfTwo:mx,ceilPowerOfTwo:gx,floorPowerOfTwo:Jf,setQuaternionFromProperEuler:_x,normalize:td,denormalize:Qf},od=class od{constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let n=this.x,i=this.y,r=t.elements;return this.x=r[0]*n+r[3]*i+r[6],this.y=r[1]*n+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=ee(this.x,t.x,n.x),this.y=ee(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=ee(this.x,t,n),this.y=ee(this.y,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ee(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(ee(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){let i=Math.cos(n),r=Math.sin(n),s=this.x-t.x,o=this.y-t.y;return this.x=s*i-o*r+t.x,this.y=s*r+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};od.prototype.isVector2=!0;var ut=od,ze=class{constructor(t=0,n=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=r}static slerpFlat(t,n,i,r,s,o,a){let c=i[r+0],l=i[r+1],h=i[r+2],u=i[r+3],d=s[o+0],f=s[o+1],p=s[o+2],_=s[o+3];if(u!==_||c!==d||l!==f||h!==p){let g=c*d+l*f+h*p+u*_;g<0&&(d=-d,f=-f,p=-p,_=-_,g=-g);let m=1-a;if(g<.9995){let y=Math.acos(g),x=Math.sin(y);m=Math.sin(m*y)/x,a=Math.sin(a*y)/x,c=c*m+d*a,l=l*m+f*a,h=h*m+p*a,u=u*m+_*a}else{c=c*m+d*a,l=l*m+f*a,h=h*m+p*a,u=u*m+_*a;let y=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=y,l*=y,h*=y,u*=y}}t[n]=c,t[n+1]=l,t[n+2]=h,t[n+3]=u}static multiplyQuaternionsFlat(t,n,i,r,s,o){let a=i[r],c=i[r+1],l=i[r+2],h=i[r+3],u=s[o],d=s[o+1],f=s[o+2],p=s[o+3];return t[n]=a*p+h*u+c*f-l*d,t[n+1]=c*p+h*d+l*u-a*f,t[n+2]=l*p+h*f+a*d-c*u,t[n+3]=h*p-a*u-c*d-l*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,r){return this._x=t,this._y=n,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){let i=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(i/2),h=a(r/2),u=a(s/2),d=c(i/2),f=c(r/2),p=c(s/2);switch(o){case"XYZ":this._x=d*h*u+l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u+d*f*p;break;case"YZX":this._x=d*h*u+l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u-d*f*p;break;case"XZY":this._x=d*h*u-l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u+d*f*p;break;default:Gt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){let i=n/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let n=t.elements,i=n[0],r=n[4],s=n[8],o=n[1],a=n[5],c=n[9],l=n[2],h=n[6],u=n[10],d=i+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(s-l)*f,this._z=(o-r)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-c)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(s+l)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(s-l)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(o-r)/f,this._x=(s+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ee(this.dot(t),-1,1)))}rotateTowards(t,n){let i=this.angleTo(t);if(i===0)return this;let r=Math.min(1,n/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){let i=t._x,r=t._y,s=t._z,o=t._w,a=n._x,c=n._y,l=n._z,h=n._w;return this._x=i*h+o*a+r*l-s*c,this._y=r*h+o*c+s*a-i*l,this._z=s*h+o*l+i*c-r*a,this._w=o*h-i*a-r*c-s*l,this._onChangeCallback(),this}slerp(t,n){let i=t._x,r=t._y,s=t._z,o=t._w,a=this.dot(t);a<0&&(i=-i,r=-r,s=-s,o=-o,a=-a);let c=1-n;if(a<.9995){let l=Math.acos(a),h=Math.sin(l);c=Math.sin(c*l)/h,n=Math.sin(n*l)/h,this._x=this._x*c+i*n,this._y=this._y*c+r*n,this._z=this._z*c+s*n,this._w=this._w*c+o*n,this._onChangeCallback()}else this._x=this._x*c+i*n,this._y=this._y*c+r*n,this._z=this._z*c+s*n,this._w=this._w*c+o*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){let t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(n),s*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},ad=class ad{constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(mm.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(mm.setFromAxisAngle(t,n))}applyMatrix3(t){let n=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6]*r,this.y=s[1]*n+s[4]*i+s[7]*r,this.z=s[2]*n+s[5]*i+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let n=this.x,i=this.y,r=this.z,s=t.elements,o=1/(s[3]*n+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*n+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*n+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*n+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(t){let n=this.x,i=this.y,r=this.z,s=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*r-a*i),h=2*(a*n-s*r),u=2*(s*i-o*n);return this.x=n+c*l+o*u-a*h,this.y=i+c*h+a*l-s*u,this.z=r+c*u+s*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let n=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*n+s[4]*i+s[8]*r,this.y=s[1]*n+s[5]*i+s[9]*r,this.z=s[2]*n+s[6]*i+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=ee(this.x,t.x,n.x),this.y=ee(this.y,t.y,n.y),this.z=ee(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=ee(this.x,t,n),this.y=ee(this.y,t,n),this.z=ee(this.z,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ee(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){let i=t.x,r=t.y,s=t.z,o=n.x,a=n.y,c=n.z;return this.x=r*c-s*a,this.y=s*o-i*c,this.z=i*a-r*o,this}projectOnVector(t){let n=t.lengthSq();if(n===0)return this.set(0,0,0);let i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return ju.copy(this).projectOnVector(t),this.sub(ju)}reflect(t){return this.sub(ju.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(ee(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return n*n+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){let r=Math.sin(n)*t;return this.x=r*Math.sin(i),this.y=Math.cos(n)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){let n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=r,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};ad.prototype.isVector3=!0;var O=ad,ju=new O,mm=new ze,cd=class cd{constructor(t,n,i,r,s,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,r,s,o,a,c,l)}set(t,n,i,r,s,o,a,c,l){let h=this.elements;return h[0]=t,h[1]=r,h[2]=a,h[3]=n,h[4]=s,h[5]=c,h[6]=i,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,r=n.elements,s=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],h=i[4],u=i[7],d=i[2],f=i[5],p=i[8],_=r[0],g=r[3],m=r[6],y=r[1],x=r[4],b=r[7],S=r[2],w=r[5],v=r[8];return s[0]=o*_+a*y+c*S,s[3]=o*g+a*x+c*w,s[6]=o*m+a*b+c*v,s[1]=l*_+h*y+u*S,s[4]=l*g+h*x+u*w,s[7]=l*m+h*b+u*v,s[2]=d*_+f*y+p*S,s[5]=d*g+f*x+p*w,s[8]=d*m+f*b+p*v,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return n*o*h-n*a*l-i*s*h+i*a*c+r*s*l-r*o*c}invert(){let t=this.elements,n=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=h*o-a*l,d=a*c-h*s,f=l*s-o*c,p=n*u+i*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/p;return t[0]=u*_,t[1]=(r*l-h*i)*_,t[2]=(a*i-r*o)*_,t[3]=d*_,t[4]=(h*n-r*c)*_,t[5]=(r*s-a*n)*_,t[6]=f*_,t[7]=(i*c-l*n)*_,t[8]=(o*n-i*s)*_,this}transpose(){let t,n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,r,s,o,a){let c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*o+l*a)+o+t,-r*l,r*c,-r*(-l*o+c*a)+a+n,0,0,1),this}scale(t,n){return Wo("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(qu.makeScale(t,n)),this}rotate(t){return Wo("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(qu.makeRotation(-t)),this}translate(t,n){return Wo("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(qu.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){let n=this.elements,i=t.elements;for(let r=0;r<9;r++)if(n[r]!==i[r])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}};cd.prototype.isMatrix3=!0;var Yt=cd,qu=new Yt,gm=new Yt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),_m=new Yt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function yx(){let e={enabled:!0,workingColorSpace:Zo,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===_e&&(r.r=Ki(r.r),r.g=Ki(r.g),r.b=Ki(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===_e&&(r.r=$s(r.r),r.g=$s(r.g),r.b=$s(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===sr?Ko:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[o].fromXYZ).multiply(this.spaces[s].toXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[Zo]:{primaries:t,whitePoint:i,transfer:Ko,toXYZ:gm,fromXYZ:_m,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:We},outputColorSpaceConfig:{drawingBufferColorSpace:We}},[We]:{primaries:t,whitePoint:i,transfer:_e,toXYZ:gm,fromXYZ:_m,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:We}}}),e}var se=yx();function Ki(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function $s(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}var Ts,nl=class{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{Ts===void 0&&(Ts=Xs("canvas")),Ts.width=t.width,Ts.height=t.height;let r=Ts.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),i=Ts}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let n=Xs("canvas");n.width=t.width,n.height=t.height;let i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let r=i.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Ki(s[o]/255)*255;return i.putImageData(r,0,0),n}else if(t.data){let n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Ki(n[i]/255)*255):n[i]=Ki(n[i]);return{data:n,width:t.width,height:t.height}}else return Gt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},vx=0,Ks=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:vx++}),this.uuid=Dr(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width||0,n.height||0,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(Xu(r[o].image)):s.push(Xu(r[o]))}else s=Xu(r);i.url=s}return n||(t.images[this.uuid]=i),i}};function Xu(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?nl.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Gt("Texture: Unable to serialize Texture."),{})}var bx=0,Yu=new O,fn=class e extends di{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=Ti,r=Ti,s=Sn,o=ir,a=gi,c=Ln,l=e.DEFAULT_ANISOTROPY,h=sr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:bx++}),this.uuid=Dr(),this.name="",this.source=new Ks(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new ut(0,0),this.repeat=new ut(1,1),this.center=new ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Yt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Yu).x}get height(){return this.source.getSize(Yu).y}get depth(){return this.source.getSize(Yu).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let n in t){let i=t[n];if(i===void 0){Gt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let r=this[n];if(r===void 0){Gt(`Texture.setValues(): property '${n}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Bf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Qc:t.x=t.x-Math.floor(t.x);break;case Ti:t.x=t.x<0?0:1;break;case tl:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Qc:t.y=t.y-Math.floor(t.y);break;case Ti:t.y=t.y<0?0:1;break;case tl:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};fn.DEFAULT_IMAGE=null;fn.DEFAULT_MAPPING=Bf;fn.DEFAULT_ANISOTROPY=1;var ld=class ld{constructor(t=0,n=0,i=0,r=1){this.x=t,this.y=n,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,r){return this.x=t,this.y=n,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let n=this.x,i=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*n+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*n+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*n+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*n+o[7]*i+o[11]*r+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,r,s,c=t.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],p=c[9],_=c[2],g=c[6],m=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(p+g)<.1&&Math.abs(l+f+m-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let x=(l+1)/2,b=(f+1)/2,S=(m+1)/2,w=(h+d)/4,v=(u+_)/4,M=(p+g)/4;return x>b&&x>S?x<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(x),r=w/i,s=v/i):b>S?b<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(b),i=w/r,s=M/r):S<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(S),i=v/s,r=M/s),this.set(i,r,s,n),this}let y=Math.sqrt((g-p)*(g-p)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(y)<.001&&(y=1),this.x=(g-p)/y,this.y=(u-_)/y,this.z=(d-h)/y,this.w=Math.acos((l+f+m-1)/2),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=ee(this.x,t.x,n.x),this.y=ee(this.y,t.y,n.y),this.z=ee(this.z,t.z,n.z),this.w=ee(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=ee(this.x,t,n),this.y=ee(this.y,t,n),this.z=ee(this.z,t,n),this.w=ee(this.w,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ee(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};ld.prototype.isVector4=!0;var Ie=ld,il=class extends di{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Sn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Ie(0,0,t,n),this.scissorTest=!1,this.viewport=new Ie(0,0,t,n),this.textures=[];let r=i.count;for(let s=0;s<r;s++)this.textures[s]=new fn({width:t,height:n,depth:i.depth}),this.textures[s].isRenderTargetTexture=!0,this.textures[s].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let n={minFilter:Sn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(n.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=n,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let r=Object.assign({},t.textures[n].image);this.textures[n].source=new Ks(r)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},wn=class extends il{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}},Qo=class extends fn{constructor(t=null,n=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Ti,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var rl=class extends fn{constructor(t=null,n=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Ti,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Ll=class Ll{constructor(t,n,i,r,s,o,a,c,l,h,u,d,f,p,_,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,r,s,o,a,c,l,h,u,d,f,p,_,g)}set(t,n,i,r,s,o,a,c,l,h,u,d,f,p,_,g){let m=this.elements;return m[0]=t,m[4]=n,m[8]=i,m[12]=r,m[1]=s,m[5]=o,m[9]=a,m[13]=c,m[2]=l,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=p,m[11]=_,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ll().fromArray(this.elements)}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){let n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){let n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let n=this.elements,i=t.elements,r=1/As.setFromMatrixColumn(t,0).length(),s=1/As.setFromMatrixColumn(t,1).length(),o=1/As.setFromMatrixColumn(t,2).length();return n[0]=i[0]*r,n[1]=i[1]*r,n[2]=i[2]*r,n[3]=0,n[4]=i[4]*s,n[5]=i[5]*s,n[6]=i[6]*s,n[7]=0,n[8]=i[8]*o,n[9]=i[9]*o,n[10]=i[10]*o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){let n=this.elements,i=t.x,r=t.y,s=t.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){let d=o*h,f=o*u,p=a*h,_=a*u;n[0]=c*h,n[4]=-c*u,n[8]=l,n[1]=f+p*l,n[5]=d-_*l,n[9]=-a*c,n[2]=_-d*l,n[6]=p+f*l,n[10]=o*c}else if(t.order==="YXZ"){let d=c*h,f=c*u,p=l*h,_=l*u;n[0]=d+_*a,n[4]=p*a-f,n[8]=o*l,n[1]=o*u,n[5]=o*h,n[9]=-a,n[2]=f*a-p,n[6]=_+d*a,n[10]=o*c}else if(t.order==="ZXY"){let d=c*h,f=c*u,p=l*h,_=l*u;n[0]=d-_*a,n[4]=-o*u,n[8]=p+f*a,n[1]=f+p*a,n[5]=o*h,n[9]=_-d*a,n[2]=-o*l,n[6]=a,n[10]=o*c}else if(t.order==="ZYX"){let d=o*h,f=o*u,p=a*h,_=a*u;n[0]=c*h,n[4]=p*l-f,n[8]=d*l+_,n[1]=c*u,n[5]=_*l+d,n[9]=f*l-p,n[2]=-l,n[6]=a*c,n[10]=o*c}else if(t.order==="YZX"){let d=o*c,f=o*l,p=a*c,_=a*l;n[0]=c*h,n[4]=_-d*u,n[8]=p*u+f,n[1]=u,n[5]=o*h,n[9]=-a*h,n[2]=-l*h,n[6]=f*u+p,n[10]=d-_*u}else if(t.order==="XZY"){let d=o*c,f=o*l,p=a*c,_=a*l;n[0]=c*h,n[4]=-u,n[8]=l*h,n[1]=d*u+_,n[5]=o*h,n[9]=f*u-p,n[2]=p*u-f,n[6]=a*h,n[10]=_*u+d}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(xx,t,Mx)}lookAt(t,n,i){let r=this.elements;return Gn.subVectors(t,n),Gn.lengthSq()===0&&(Gn.z=1),Gn.normalize(),yr.crossVectors(i,Gn),yr.lengthSq()===0&&(Math.abs(i.z)===1?Gn.x+=1e-4:Gn.z+=1e-4,Gn.normalize(),yr.crossVectors(i,Gn)),yr.normalize(),_c.crossVectors(Gn,yr),r[0]=yr.x,r[4]=_c.x,r[8]=Gn.x,r[1]=yr.y,r[5]=_c.y,r[9]=Gn.y,r[2]=yr.z,r[6]=_c.z,r[10]=Gn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,r=n.elements,s=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],h=i[1],u=i[5],d=i[9],f=i[13],p=i[2],_=i[6],g=i[10],m=i[14],y=i[3],x=i[7],b=i[11],S=i[15],w=r[0],v=r[4],M=r[8],U=r[12],P=r[1],k=r[5],C=r[9],N=r[13],T=r[2],I=r[6],B=r[10],D=r[14],j=r[3],H=r[7],Z=r[11],$=r[15];return s[0]=o*w+a*P+c*T+l*j,s[4]=o*v+a*k+c*I+l*H,s[8]=o*M+a*C+c*B+l*Z,s[12]=o*U+a*N+c*D+l*$,s[1]=h*w+u*P+d*T+f*j,s[5]=h*v+u*k+d*I+f*H,s[9]=h*M+u*C+d*B+f*Z,s[13]=h*U+u*N+d*D+f*$,s[2]=p*w+_*P+g*T+m*j,s[6]=p*v+_*k+g*I+m*H,s[10]=p*M+_*C+g*B+m*Z,s[14]=p*U+_*N+g*D+m*$,s[3]=y*w+x*P+b*T+S*j,s[7]=y*v+x*k+b*I+S*H,s[11]=y*M+x*C+b*B+S*Z,s[15]=y*U+x*N+b*D+S*$,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[4],r=t[8],s=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],u=t[6],d=t[10],f=t[14],p=t[3],_=t[7],g=t[11],m=t[15],y=c*f-l*d,x=a*f-l*u,b=a*d-c*u,S=o*f-l*h,w=o*d-c*h,v=o*u-a*h;return n*(_*y-g*x+m*b)-i*(p*y-g*S+m*w)+r*(p*x-_*S+m*v)-s*(p*b-_*w+g*v)}determinantAffine(){let t=this.elements,n=t[0],i=t[4],r=t[8],s=t[1],o=t[5],a=t[9],c=t[2],l=t[6],h=t[10];return n*(o*h-a*l)-i*(s*h-a*c)+r*(s*l-o*c)}transpose(){let t=this.elements,n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){let r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=n,r[14]=i),this}invert(){let t=this.elements,n=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=t[9],d=t[10],f=t[11],p=t[12],_=t[13],g=t[14],m=t[15],y=n*a-i*o,x=n*c-r*o,b=n*l-s*o,S=i*c-r*a,w=i*l-s*a,v=r*l-s*c,M=h*_-u*p,U=h*g-d*p,P=h*m-f*p,k=u*g-d*_,C=u*m-f*_,N=d*m-f*g,T=y*N-x*C+b*k+S*P-w*U+v*M;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let I=1/T;return t[0]=(a*N-c*C+l*k)*I,t[1]=(r*C-i*N-s*k)*I,t[2]=(_*v-g*w+m*S)*I,t[3]=(d*w-u*v-f*S)*I,t[4]=(c*P-o*N-l*U)*I,t[5]=(n*N-r*P+s*U)*I,t[6]=(g*b-p*v-m*x)*I,t[7]=(h*v-d*b+f*x)*I,t[8]=(o*C-a*P+l*M)*I,t[9]=(i*P-n*C-s*M)*I,t[10]=(p*w-_*b+m*y)*I,t[11]=(u*b-h*w-f*y)*I,t[12]=(a*U-o*k-c*M)*I,t[13]=(n*k-i*U+r*M)*I,t[14]=(_*x-p*S-g*y)*I,t[15]=(h*S-u*x+d*y)*I,this}scale(t){let n=this.elements,i=t.x,r=t.y,s=t.z;return n[0]*=i,n[4]*=r,n[8]*=s,n[1]*=i,n[5]*=r,n[9]*=s,n[2]*=i,n[6]*=r,n[10]*=s,n[3]*=i,n[7]*=r,n[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,r))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){let n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){let i=Math.cos(n),r=Math.sin(n),s=1-i,o=t.x,a=t.y,c=t.z,l=s*o,h=s*a;return this.set(l*o+i,l*a-r*c,l*c+r*a,0,l*a+r*c,h*a+i,h*c-r*o,0,l*c-r*a,h*c+r*o,s*c*c+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,r,s,o){return this.set(1,i,s,0,t,1,o,0,n,r,1,0,0,0,0,1),this}compose(t,n,i){let r=this.elements,s=n._x,o=n._y,a=n._z,c=n._w,l=s+s,h=o+o,u=a+a,d=s*l,f=s*h,p=s*u,_=o*h,g=o*u,m=a*u,y=c*l,x=c*h,b=c*u,S=i.x,w=i.y,v=i.z;return r[0]=(1-(_+m))*S,r[1]=(f+b)*S,r[2]=(p-x)*S,r[3]=0,r[4]=(f-b)*w,r[5]=(1-(d+m))*w,r[6]=(g+y)*w,r[7]=0,r[8]=(p+x)*v,r[9]=(g-y)*v,r[10]=(1-(d+_))*v,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,n,i){let r=this.elements;t.x=r[12],t.y=r[13],t.z=r[14];let s=this.determinantAffine();if(s===0)return i.set(1,1,1),n.identity(),this;let o=As.set(r[0],r[1],r[2]).length(),a=As.set(r[4],r[5],r[6]).length(),c=As.set(r[8],r[9],r[10]).length();s<0&&(o=-o),hi.copy(this);let l=1/o,h=1/a,u=1/c;return hi.elements[0]*=l,hi.elements[1]*=l,hi.elements[2]*=l,hi.elements[4]*=h,hi.elements[5]*=h,hi.elements[6]*=h,hi.elements[8]*=u,hi.elements[9]*=u,hi.elements[10]*=u,n.setFromRotationMatrix(hi),i.x=o,i.y=a,i.z=c,this}makePerspective(t,n,i,r,s,o,a=ti,c=!1){let l=this.elements,h=2*s/(n-t),u=2*s/(i-r),d=(n+t)/(n-t),f=(i+r)/(i-r),p,_;if(c)p=s/(o-s),_=o*s/(o-s);else if(a===ti)p=-(o+s)/(o-s),_=-2*o*s/(o-s);else if(a===qs)p=-o/(o-s),_=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,n,i,r,s,o,a=ti,c=!1){let l=this.elements,h=2/(n-t),u=2/(i-r),d=-(n+t)/(n-t),f=-(i+r)/(i-r),p,_;if(c)p=1/(o-s),_=o/(o-s);else if(a===ti)p=-2/(o-s),_=-(o+s)/(o-s);else if(a===qs)p=-1/(o-s),_=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=u,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=p,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let n=this.elements,i=t.elements;for(let r=0;r<16;r++)if(n[r]!==i[r])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}};Ll.prototype.isMatrix4=!0;var Vt=Ll,As=new O,hi=new Vt,xx=new O(0,0,0),Mx=new O(1,1,1),yr=new O,_c=new O,Gn=new O,ym=new Vt,vm=new ze,Qi=class e{constructor(t=0,n=0,i=0,r=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,r=this._order){return this._x=t,this._y=n,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){let r=t.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],h=r[9],u=r[2],d=r[6],f=r[10];switch(n){case"XYZ":this._y=Math.asin(ee(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ee(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(ee(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-ee(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ee(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-ee(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Gt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return ym.makeRotationFromQuaternion(t),this.setFromRotationMatrix(ym,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return vm.setFromEuler(this),this.setFromQuaternion(vm,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Qi.DEFAULT_ORDER="XYZ";var Js=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Sx=0,bm=new O,Cs=new ze,$i=new Vt,yc=new O,No=new O,wx=new O,Ex=new ze,xm=new O(1,0,0),Mm=new O(0,1,0),Sm=new O(0,0,1),wm={type:"added"},Tx={type:"removed"},Rs={type:"childadded",child:null},Zu={type:"childremoved",child:null},nn=class e extends di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Sx++}),this.uuid=Dr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new O,n=new Qi,i=new ze,r=new O(1,1,1);function s(){i.setFromEuler(n,!1)}function o(){n.setFromQuaternion(i,void 0,!1)}n._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Vt},normalMatrix:{value:new Yt}}),this.matrix=new Vt,this.matrixWorld=new Vt,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Js,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return Cs.setFromAxisAngle(t,n),this.quaternion.multiply(Cs),this}rotateOnWorldAxis(t,n){return Cs.setFromAxisAngle(t,n),this.quaternion.premultiply(Cs),this}rotateX(t){return this.rotateOnAxis(xm,t)}rotateY(t){return this.rotateOnAxis(Mm,t)}rotateZ(t){return this.rotateOnAxis(Sm,t)}translateOnAxis(t,n){return bm.copy(t).applyQuaternion(this.quaternion),this.position.add(bm.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(xm,t)}translateY(t){return this.translateOnAxis(Mm,t)}translateZ(t){return this.translateOnAxis(Sm,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4($i.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?yc.copy(t):yc.set(t,n,i);let r=this.parent;this.updateWorldMatrix(!0,!1),No.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?$i.lookAt(No,yc,this.up):$i.lookAt(yc,No,this.up),this.quaternion.setFromRotationMatrix($i),r&&($i.extractRotation(r.matrixWorld),Cs.setFromRotationMatrix($i),this.quaternion.premultiply(Cs.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(qt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(wm),Rs.child=t,this.dispatchEvent(Rs),Rs.child=null):qt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(Tx),Zu.child=t,this.dispatchEvent(Zu),Zu.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),$i.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),$i.multiply(t.parent.matrixWorld)),t.applyMatrix4($i),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(wm),Rs.child=t,this.dispatchEvent(Rs),Rs.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,r=this.children.length;i<r;i++){let o=this.children[i].getObjectByProperty(t,n);if(o!==void 0)return o}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(No,t,wx),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(No,Ex,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverseVisible(t)}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let n=t.x,i=t.y,r=t.z,s=this.matrix.elements;s[12]+=n-s[0]*n-s[4]*i-s[8]*r,s[13]+=i-s[1]*n-s[5]*i-s[9]*r,s[14]+=r-s[2]*n-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){let r=this.parent;if(t===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){let s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(!1,!0,i)}}toJSON(t){let n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(t),r.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];s(t.shapes,u)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(t.materials,this.material[c]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];r.animations.push(s(t.animations,c))}}if(n){let a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),p=o(t.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),p.length>0&&(i.nodes=p)}return i.object=r,i;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){let r=t.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};nn.DEFAULT_UP=new O(0,1,0);nn.DEFAULT_MATRIX_AUTO_UPDATE=!0;nn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var In=class extends nn{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ax={type:"move"},Qs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new In,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new In,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new In,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let n=this._hand;if(n)for(let i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let r=null,s=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(let _ of t.hand.values()){let g=n.getJointPose(_,i),m=this._getHandJoint(l,_);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.quaternion,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;l.inputState.pinching&&d>f+p?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&d<=f-p&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=n.getPose(t.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.quaternion,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));a!==null&&(r=n.getPose(t.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.quaternion,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ax)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){let i=new In;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}},Ng={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vr={h:0,s:0,l:0},vc={h:0,s:0,l:0};function Ku(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Wt=class{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){let r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=We){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,se.colorSpaceToWorking(this,n),this}setRGB(t,n,i,r=se.workingColorSpace){return this.r=t,this.g=n,this.b=i,se.colorSpaceToWorking(this,r),this}setHSL(t,n,i,r=se.workingColorSpace){if(t=Kf(t,1),n=ee(n,0,1),i=ee(i,0,1),n===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+n):i+n-i*n,o=2*i-s;this.r=Ku(o,s,t+1/3),this.g=Ku(o,s,t),this.b=Ku(o,s,t-1/3)}return se.colorSpaceToWorking(this,r),this}setStyle(t,n=We){function i(s){s!==void 0&&parseFloat(s)<1&&Gt("Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,n);if(s=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseFloat(s[1]))/100,Math.min(100,parseFloat(s[2]))/100,Math.min(100,parseFloat(s[3]))/100,n);break;case"hsl":case"hsla":if(s=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,n);break;default:Gt("Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,n);if(o===6)return this.setHex(parseInt(s,16),n);Gt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=We){let i=Ng[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Gt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ki(t.r),this.g=Ki(t.g),this.b=Ki(t.b),this}copyLinearToSRGB(t){return this.r=$s(t.r),this.g=$s(t.g),this.b=$s(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=We){return se.workingToColorSpace(un.copy(this),t),Math.round(ee(un.r*255,0,255))*65536+Math.round(ee(un.g*255,0,255))*256+Math.round(ee(un.b*255,0,255))}getHexString(t=We){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=se.workingColorSpace){se.workingToColorSpace(un.copy(this),n);let i=un.r,r=un.g,s=un.b,o=Math.max(i,r,s),a=Math.min(i,r,s),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case i:c=(r-s)/u+(r<s?6:0);break;case r:c=(s-i)/u+2;break;case s:c=(i-r)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,n=se.workingColorSpace){return se.workingToColorSpace(un.copy(this),n),t.r=un.r,t.g=un.g,t.b=un.b,t}getStyle(t=We){se.workingToColorSpace(un.copy(this),t);let n=un.r,i=un.g,r=un.b;return t!==We?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,n,i){return this.getHSL(vr),this.setHSL(vr.h+t,vr.s+n,vr.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(vr),t.getHSL(vc);let i=jo(vr.h,vc.h,n),r=jo(vr.s,vc.s,n),s=jo(vr.l,vc.l,n);return this.setHSL(i,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let n=this.r,i=this.g,r=this.b,s=t.elements;return this.r=s[0]*n+s[3]*i+s[6]*r,this.g=s[1]*n+s[4]*i+s[7]*r,this.b=s[2]*n+s[5]*i+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},un=new Wt;Wt.NAMES=Ng;var ta=class e{constructor(t,n=1,i=1e3){this.isFog=!0,this.name="",this.color=new Wt(t),this.near=n,this.far=i}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ea=class extends nn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Qi,this.environmentIntensity=1,this.environmentRotation=new Qi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}},ui=new O,ji=new O,Ju=new O,qi=new O,Ps=new O,Is=new O,Em=new O,Qu=new O,tf=new O,ef=new O,nf=new Ie,rf=new Ie,sf=new Ie,Zi=class e{constructor(t=new O,n=new O,i=new O){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,r){r.subVectors(i,n),ui.subVectors(t,n),r.cross(ui);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,n,i,r,s){ui.subVectors(r,n),ji.subVectors(i,n),Ju.subVectors(t,n);let o=ui.dot(ui),a=ui.dot(ji),c=ui.dot(Ju),l=ji.dot(ji),h=ji.dot(Ju),u=o*l-a*a;if(u===0)return s.set(0,0,0),null;let d=1/u,f=(l*c-a*h)*d,p=(o*h-a*c)*d;return s.set(1-f-p,p,f)}static containsPoint(t,n,i,r){return this.getBarycoord(t,n,i,r,qi)===null?!1:qi.x>=0&&qi.y>=0&&qi.x+qi.y<=1}static getInterpolation(t,n,i,r,s,o,a,c){return this.getBarycoord(t,n,i,r,qi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,qi.x),c.addScaledVector(o,qi.y),c.addScaledVector(a,qi.z),c)}static getInterpolatedAttribute(t,n,i,r,s,o){return nf.setScalar(0),rf.setScalar(0),sf.setScalar(0),nf.fromBufferAttribute(t,n),rf.fromBufferAttribute(t,i),sf.fromBufferAttribute(t,r),o.setScalar(0),o.addScaledVector(nf,s.x),o.addScaledVector(rf,s.y),o.addScaledVector(sf,s.z),o}static isFrontFacing(t,n,i,r){return ui.subVectors(i,n),ji.subVectors(t,n),ui.cross(ji).dot(r)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,r){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,n,i,r){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ui.subVectors(this.c,this.b),ji.subVectors(this.a,this.b),ui.cross(ji).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,r,s){return e.getInterpolation(t,this.a,this.b,this.c,n,i,r,s)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){let i=this.a,r=this.b,s=this.c,o,a;Ps.subVectors(r,i),Is.subVectors(s,i),Qu.subVectors(t,i);let c=Ps.dot(Qu),l=Is.dot(Qu);if(c<=0&&l<=0)return n.copy(i);tf.subVectors(t,r);let h=Ps.dot(tf),u=Is.dot(tf);if(h>=0&&u<=h)return n.copy(r);let d=c*u-h*l;if(d<=0&&c>=0&&h<=0&&c-h>0)return o=c/(c-h),n.copy(i).addScaledVector(Ps,o);ef.subVectors(t,s);let f=Ps.dot(ef),p=Is.dot(ef);if(p>=0&&f<=p)return n.copy(s);let _=f*l-c*p;if(_<=0&&l>=0&&p<=0)return a=l/(l-p),n.copy(i).addScaledVector(Is,a);let g=h*p-f*u;if(g<=0&&u-h>=0&&f-p>=0)return Em.subVectors(s,r),a=(u-h)/(u-h+(f-p)),n.copy(r).addScaledVector(Em,a);let m=1/(g+_+d);return o=_*m,a=d*m,n.copy(i).addScaledVector(Ps,o).addScaledVector(Is,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},dn=class{constructor(t=new O(1/0,1/0,1/0),n=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(fi.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(fi.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){let i=fi.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let s=i.getAttribute("position");if(n===!0&&s!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,fi):fi.fromBufferAttribute(s,o),fi.applyMatrix4(t.matrixWorld),this.expandByPoint(fi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),bc.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),bc.copy(i.boundingBox)),bc.applyMatrix4(t.matrixWorld),this.union(bc)}let r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,fi),fi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Oo),xc.subVectors(this.max,Oo),Ls.subVectors(t.a,Oo),Ds.subVectors(t.b,Oo),Ns.subVectors(t.c,Oo),br.subVectors(Ds,Ls),xr.subVectors(Ns,Ds),Jr.subVectors(Ls,Ns);let n=[0,-br.z,br.y,0,-xr.z,xr.y,0,-Jr.z,Jr.y,br.z,0,-br.x,xr.z,0,-xr.x,Jr.z,0,-Jr.x,-br.y,br.x,0,-xr.y,xr.x,0,-Jr.y,Jr.x,0];return!of(n,Ls,Ds,Ns,xc)||(n=[1,0,0,0,1,0,0,0,1],!of(n,Ls,Ds,Ns,xc))?!1:(Mc.crossVectors(br,xr),n=[Mc.x,Mc.y,Mc.z],of(n,Ls,Ds,Ns,xc))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,fi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(fi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Xi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Xi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Xi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Xi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Xi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Xi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Xi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Xi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Xi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Xi=[new O,new O,new O,new O,new O,new O,new O,new O],fi=new O,bc=new dn,Ls=new O,Ds=new O,Ns=new O,br=new O,xr=new O,Jr=new O,Oo=new O,xc=new O,Mc=new O,Qr=new O;function of(e,t,n,i,r){for(let s=0,o=e.length-3;s<=o;s+=3){Qr.fromArray(e,s);let a=r.x*Math.abs(Qr.x)+r.y*Math.abs(Qr.y)+r.z*Math.abs(Qr.z),c=t.dot(Qr),l=n.dot(Qr),h=i.dot(Qr);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var Be=new O,Sc=new ut,Cx=0,en=class extends di{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Cx++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=Yf,this.updateRanges=[],this.gpuType=ii,this.version=0,this._normalizationScale=t!==void 0?xh(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=n.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Sc.fromBufferAttribute(this,n),Sc.applyMatrix3(t),this.setXY(n,Sc.x,Sc.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Be.fromBufferAttribute(this,n),Be.applyMatrix3(t),this.setXYZ(n,Be.x,Be.y,Be.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)Be.fromBufferAttribute(this,n),Be.applyMatrix4(t),this.setXYZ(n,Be.x,Be.y,Be.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Be.fromBufferAttribute(this,n),Be.applyNormalMatrix(t),this.setXYZ(n,Be.x,Be.y,Be.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Be.fromBufferAttribute(this,n),Be.transformDirection(t),this.setXYZ(n,Be.x,Be.y,Be.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=this._denormalize(i)),i}setComponent(t,n,i){return this.normalized&&(i=this._normalize(i)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=this._denormalize(n)),n}setX(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=this._denormalize(n)),n}setY(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=this._denormalize(n)),n}setZ(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=this._denormalize(n)),n}setW(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,r){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,n,i,r,s){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i),r=this._normalize(r),s=this._normalize(s)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let n=this._normalizationScale;return n!==void 0?Math.max(t/n,-1):Qf(t,this.array)}_normalize(t){let n=this._normalizationScale;return n!==void 0?Math.round(t*n):td(t,this.array)}};var na=class extends en{constructor(t,n,i){super(new Uint16Array(t),n,i)}};var ia=class extends en{constructor(t,n,i){super(new Uint32Array(t),n,i)}};var de=class extends en{constructor(t,n,i){super(new Float32Array(t),n,i)}},Rx=new dn,Fo=new O,af=new O,pi=class{constructor(t=new O,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){let i=this.center;n!==void 0?i.copy(n):Rx.setFromPoints(t).getCenter(i);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){let i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Fo.subVectors(t,this.center);let n=Fo.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),r=(i-this.radius)*.5;this.center.addScaledVector(Fo,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(af.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Fo.copy(t.center).add(af)),this.expandByPoint(Fo.copy(t.center).sub(af))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Px=0,Qn=new Vt,cf=new nn,Os=new O,Vn=new dn,Uo=new dn,Ze=new O,Ae=class e extends di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Px++}),this.uuid=Dr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(ex(t)?ia:na)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Yt().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Qn.makeRotationFromQuaternion(t),this.applyMatrix4(Qn),this}rotateX(t){return Qn.makeRotationX(t),this.applyMatrix4(Qn),this}rotateY(t){return Qn.makeRotationY(t),this.applyMatrix4(Qn),this}rotateZ(t){return Qn.makeRotationZ(t),this.applyMatrix4(Qn),this}translate(t,n,i){return Qn.makeTranslation(t,n,i),this.applyMatrix4(Qn),this}scale(t,n,i){return Qn.makeScale(t,n,i),this.applyMatrix4(Qn),this}lookAt(t){return cf.lookAt(t),cf.updateMatrix(),this.applyMatrix4(cf.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Os).negate(),this.translate(Os.x,Os.y,Os.z),this}setFromPoints(t){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let r=0,s=t.length;r<s;r++){let o=t[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new de(i,3))}else{let i=Math.min(t.length,n.count);for(let r=0;r<i;r++){let s=t[r];n.setXYZ(r,s.x,s.y,s.z||0)}t.length>n.count&&Gt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new dn);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){qt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,r=n.length;i<r;i++){let s=n[i];Vn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ze.addVectors(this.boundingBox.min,Vn.min),this.boundingBox.expandByPoint(Ze),Ze.addVectors(this.boundingBox.max,Vn.max),this.boundingBox.expandByPoint(Ze)):(this.boundingBox.expandByPoint(Vn.min),this.boundingBox.expandByPoint(Vn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&qt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pi);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){qt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){let i=this.boundingSphere.center;if(Vn.setFromBufferAttribute(t),n)for(let s=0,o=n.length;s<o;s++){let a=n[s];Uo.setFromBufferAttribute(a),this.morphTargetsRelative?(Ze.addVectors(Vn.min,Uo.min),Vn.expandByPoint(Ze),Ze.addVectors(Vn.max,Uo.max),Vn.expandByPoint(Ze)):(Vn.expandByPoint(Uo.min),Vn.expandByPoint(Uo.max))}Vn.getCenter(i);let r=0;for(let s=0,o=t.count;s<o;s++)Ze.fromBufferAttribute(t,s),r=Math.max(r,i.distanceToSquared(Ze));if(n)for(let s=0,o=n.length;s<o;s++){let a=n[s],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)Ze.fromBufferAttribute(a,l),c&&(Os.fromBufferAttribute(t,l),Ze.add(Os)),r=Math.max(r,i.distanceToSquared(Ze))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&qt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){qt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,r=n.normal,s=n.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new en(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],c=[],l=new Uint8Array(i.count);for(let U=0;U<i.count;U++)a[U]=new O,c[U]=new O;let h=new O,u=new O,d=new O,f=new ut,p=new ut,_=new ut,g=new O,m=new O;function y(U,P,k){l[U]=l[P]=l[k]=1,h.fromBufferAttribute(i,U),u.fromBufferAttribute(i,P),d.fromBufferAttribute(i,k),f.fromBufferAttribute(s,U),p.fromBufferAttribute(s,P),_.fromBufferAttribute(s,k),u.sub(h),d.sub(h),p.sub(f),_.sub(f);let C=1/(p.x*_.y-_.x*p.y);isFinite(C)&&(g.copy(u).multiplyScalar(_.y).addScaledVector(d,-p.y).multiplyScalar(C),m.copy(d).multiplyScalar(p.x).addScaledVector(u,-_.x).multiplyScalar(C),a[U].add(g),a[P].add(g),a[k].add(g),c[U].add(m),c[P].add(m),c[k].add(m))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let U=0,P=x.length;U<P;++U){let k=x[U],C=k.start,N=k.count;for(let T=C,I=C+N;T<I;T+=3)y(t.getX(T+0),t.getX(T+1),t.getX(T+2))}let b=new O,S=new O,w=new O,v=new O;function M(U){w.fromBufferAttribute(r,U),v.copy(w);let P=a[U];b.copy(P),b.sub(w.multiplyScalar(w.dot(P))).normalize(),S.crossVectors(v,P);let C=S.dot(c[U])<0?-1:1;o.setXYZW(U,b.x,b.y,b.z,C)}for(let U=0,P=i.count;U<P;++U)l[U]&&M(U);this._transformed=!0}computeVertexNormals(){let t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new en(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let r=new O,s=new O,o=new O,a=new O,c=new O,l=new O,h=new O,u=new O;if(t)for(let d=0,f=t.count;d<f;d+=3){let p=t.getX(d+0),_=t.getX(d+1),g=t.getX(d+2);r.fromBufferAttribute(n,p),s.fromBufferAttribute(n,_),o.fromBufferAttribute(n,g),h.subVectors(o,s),u.subVectors(r,s),h.cross(u),a.fromBufferAttribute(i,p),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,g),a.add(h),c.add(h),l.add(h),i.setXYZ(p,a.x,a.y,a.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(g,l.x,l.y,l.z)}else for(let d=0,f=n.count;d<f;d+=3)r.fromBufferAttribute(n,d+0),s.fromBufferAttribute(n,d+1),o.fromBufferAttribute(n,d+2),h.subVectors(o,s),u.subVectors(r,s),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)Ze.fromBufferAttribute(t,n),Ze.normalize(),t.setXYZ(n,Ze.x,Ze.y,Ze.z)}toNonIndexed(){function t(a,c){let l=a.array,h=a.itemSize,u=a.normalized,d=new l.constructor(c.length*h),f=0,p=0;for(let _=0,g=c.length;_<g;_++){a.isInterleavedBufferAttribute?f=c[_]*a.data.stride+a.offset:f=c[_]*h;for(let m=0;m<h;m++)d[p++]=l[f++]}return new en(d,h,u)}if(this.index===null)return Gt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new e,i=this.index.array,r=this.attributes;for(let a in r){let c=r[a],l=t(c,i);n.setAttribute(a,l)}let s=this.morphAttributes;for(let a in s){let c=[],l=s[a];for(let h=0,u=l.length;h<u;h++){let d=l[h],f=t(d,i);c.push(f)}n.morphAttributes[a]=c}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];n.addGroup(l.start,l.count,l.materialIndex)}return n}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let c in i){let l=i[c];t.data.attributes[c]=l.toJSON(t.data)}let r={},s=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){let f=l[u];h.push(f.toJSON(t.data))}h.length>0&&(r[c]=h,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let r=t.attributes;for(let l in r){let h=r[l];this.setAttribute(l,h.clone(n))}let s=t.morphAttributes;for(let l in s){let h=[],u=s[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(n));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},sl=class{constructor(t,n){this.isInterleavedBuffer=!0,this.array=t,this.stride=n,this.count=t!==void 0?t.length/n:0,this.usage=Yf,this.updateRanges=[],this.version=0,this.uuid=Dr()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,n,i){t*=this.stride,i*=n.stride;for(let r=0,s=this.stride;r<s;r++)this.array[t+r]=n.array[i+r];return this}set(t,n=0){return this.array.set(t,n),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={});let n=Tm(this.array);t.arrayBuffers[n]===void 0&&(t.arrayBuffers[n]=this.array.slice(0).buffer);let i=new this.array.constructor(t.arrayBuffers[n]),r=new this.constructor(i,this.stride);return r.setUsage(this.usage),r}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={});let n=Tm(this.array);t.arrayBuffers[n]===void 0&&(t.arrayBuffers[n]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let i={uuid:this.uuid,buffer:n,type:this.array.constructor.name,stride:this.stride};return i.usage=this.usage,i}};function Tm(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=Dr()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+":"+e.byteOffset+":"+e.byteLength}var bn=new O,ra=class e{constructor(t,n,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=n,this.offset=i,this.normalized=r,this._normalizationScale=t!==void 0?xh(t.array):void 0}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let n=0,i=this.data.count;n<i;n++)bn.fromBufferAttribute(this,n),bn.applyMatrix4(t),this.setXYZ(n,bn.x,bn.y,bn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)bn.fromBufferAttribute(this,n),bn.applyNormalMatrix(t),this.setXYZ(n,bn.x,bn.y,bn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)bn.fromBufferAttribute(this,n),bn.transformDirection(t),this.setXYZ(n,bn.x,bn.y,bn.z);return this}getComponent(t,n){let i=this.array[t*this.data.stride+this.offset+n];return this.normalized&&(i=this._denormalize(i)),i}setComponent(t,n,i){return this.normalized&&(i=this._normalize(i)),this.data.array[t*this.data.stride+this.offset+n]=i,this}setX(t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[t*this.data.stride+this.offset]=n,this}setY(t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[t*this.data.stride+this.offset+1]=n,this}setZ(t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[t*this.data.stride+this.offset+2]=n,this}setW(t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[t*this.data.stride+this.offset+3]=n,this}getX(t){let n=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(n=this._denormalize(n)),n}getY(t){let n=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(n=this._denormalize(n)),n}getZ(t){let n=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(n=this._denormalize(n)),n}getW(t){let n=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(n=this._denormalize(n)),n}setXY(t,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(n=this._normalize(n),i=this._normalize(i)),this.data.array[t+0]=n,this.data.array[t+1]=i,this}setXYZ(t,n,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=r,this}setXYZW(t,n,i,r,s){return t=t*this.data.stride+this.offset,this.normalized&&(n=this._normalize(n),i=this._normalize(i),r=this._normalize(r),s=this._normalize(s)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=r,this.data.array[t+3]=s,this}clone(t){if(t===void 0){Jo("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)n.push(this.data.array[r+s])}return new en(new this.array.constructor(n),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Jo("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)n.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:n,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(t){let n=this._normalizationScale;return n!==void 0?Math.max(t/n,-1):Qf(t,this.data.array)}_normalize(t){let n=this._normalizationScale;return n!==void 0?Math.round(t*n):td(t,this.data.array)}},lf=new O,Ix=new O,Lx=new Yt,xn=class{constructor(t=new O(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,r){return this.normal.set(t,n,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){let r=lf.subVectors(i,n).cross(Ix.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){let r=t.delta(lf),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;let o=-(t.start.dot(this.normal)+this.constant)/s;return i===!0&&(o<0||o>1)?null:n.copy(t.start).addScaledVector(r,o)}intersectsLine(t){let n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){let i=n||Lx.getNormalMatrix(t),r=this.coplanarPoint(lf).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},Dx=0,Ai=class extends di{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Dx++}),this.uuid=Dr(),this.name="",this.type="Material",this.blending=lo,this.side=Ir,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pf,this.blendDst=If,this.blendEquation=as,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Wt(0,0,0),this.blendAlpha=0,this.depthFunc=js,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=wg,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Wc,this.stencilZFail=Wc,this.stencilZPass=Wc,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let n in t){let i=t[n];if(i===void 0){Gt(`Material: parameter '${n}' has value of undefined.`);continue}let r=this[n];if(r===void 0){Gt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(i.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(i.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(i.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(i.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let o=[];for(let a in s){let c=s[a];delete c.metadata,o.push(c)}return o}if(n){let s=r(t.textures),o=r(t.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Wt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new xn().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ut().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ut().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=n[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let n=t.clippingPlanes,i=null;if(n!==null){let r=n.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=n[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Sr=class extends Ai{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Wt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Fs,ko=new O,Us=new O,ks=new O,Bs=new ut,Bo=new ut,Og=new Vt,wc=new O,zo=new O,Ec=new O,Am=new ut,hf=new ut,Cm=new ut,ns=class extends nn{constructor(t=new Sr){if(super(),this.isSprite=!0,this.type="Sprite",Fs===void 0){Fs=new Ae;let n=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new sl(n,5);Fs.setIndex([0,1,2,0,2,3]),Fs.setAttribute("position",new ra(i,3,0,!1)),Fs.setAttribute("uv",new ra(i,2,3,!1))}this.geometry=Fs,this.material=t,this.center=new ut(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,n){t.camera===null&&qt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Us.setFromMatrixScale(this.matrixWorld),Og.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),ks.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Us.multiplyScalar(-ks.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let o=this.center;Tc(wc.set(-.5,-.5,0),ks,o,Us,r,s),Tc(zo.set(.5,-.5,0),ks,o,Us,r,s),Tc(Ec.set(.5,.5,0),ks,o,Us,r,s),Am.set(0,0),hf.set(1,0),Cm.set(1,1);let a=t.ray.intersectTriangle(wc,zo,Ec,!1,ko);if(a===null&&(Tc(zo.set(-.5,.5,0),ks,o,Us,r,s),hf.set(0,1),a=t.ray.intersectTriangle(wc,Ec,zo,!1,ko),a===null))return;let c=t.ray.origin.distanceTo(ko);c<t.near||c>t.far||n.push({distance:c,point:ko.clone(),uv:Zi.getInterpolation(ko,wc,zo,Ec,Am,hf,Cm,new ut),face:null,object:this})}copy(t,n){return super.copy(t,n),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}toJSON(t){let n=super.toJSON(t);return n.object.center=this.center.toArray(),n}};function Tc(e,t,n,i,r,s){Bs.subVectors(e,n).addScalar(.5).multiply(i),r!==void 0?(Bo.x=s*Bs.x-r*Bs.y,Bo.y=r*Bs.x+s*Bs.y):Bo.copy(Bs),e.copy(t),e.x+=Bo.x,e.y+=Bo.y,e.applyMatrix4(Og)}var Yi=new O,uf=new O,Ac=new O,Cc=new O,wr=class{constructor(t=new O,n=new O(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Yi)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let n=Yi.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Yi.copy(this.origin).addScaledVector(this.direction,n),Yi.distanceToSquared(t))}distanceSqToSegment(t,n,i,r){uf.copy(t).add(n).multiplyScalar(.5),Ac.copy(n).sub(t).normalize(),Cc.copy(this.origin).sub(uf);let s=t.distanceTo(n)*.5,o=-this.direction.dot(Ac),a=Cc.dot(this.direction),c=-Cc.dot(Ac),l=Cc.lengthSq(),h=Math.abs(1-o*o),u,d,f,p;if(h>0)if(u=o*c-a,d=o*a-c,p=s*h,u>=0)if(d>=-p)if(d<=p){let _=1/h;u*=_,d*=_,f=u*(u+o*d+2*a)+d*(o*u+d+2*c)+l}else d=s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d=-s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d<=-p?(u=Math.max(0,-(-o*s+a)),d=u>0?-s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+l):d<=p?(u=0,d=Math.min(Math.max(-s,-c),s),f=d*(d+2*c)+l):(u=Math.max(0,-(o*s+a)),d=u>0?s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+l);else d=o>0?-s:s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(uf).addScaledVector(Ac,d),f}intersectSphere(t,n){if(t.radius<0)return null;Yi.subVectors(t.center,this.origin);let i=Yi.dot(this.direction),r=Yi.dot(Yi)-i*i,s=t.radius*t.radius;if(r>s)return null;let o=Math.sqrt(s-r),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,n):this.at(a,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){let i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){let n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,r,s,o,a,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(i=(t.min.x-d.x)*l,r=(t.max.x-d.x)*l):(i=(t.max.x-d.x)*l,r=(t.min.x-d.x)*l),h>=0?(s=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(s=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),u>=0?(a=(t.min.z-d.z)*u,c=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,c=(t.min.z-d.z)*u),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,n)}intersectsBox(t){return this.intersectBox(t,Yi)!==null}intersectTriangle(t,n,i,r,s){let o=this.origin,a=this.direction,c=a.x,l=a.y,h=a.z,u=t.x-o.x,d=t.y-o.y,f=t.z-o.z,p=n.x-o.x,_=n.y-o.y,g=n.z-o.z,m=i.x-o.x,y=i.y-o.y,x=i.z-o.z,b=Math.abs(c),S=Math.abs(l),w=Math.abs(h),v,M,U,P,k,C,N,T,I,B,D,j;if(b>=S&&b>=w?(U=c,C=u,I=p,j=m,c>=0?(v=l,M=h,P=d,k=f,N=_,T=g,B=y,D=x):(v=h,M=l,P=f,k=d,N=g,T=_,B=x,D=y)):S>=w?(U=l,C=d,I=_,j=y,l>=0?(v=h,M=c,P=f,k=u,N=g,T=p,B=x,D=m):(v=c,M=h,P=u,k=f,N=p,T=g,B=m,D=x)):(U=h,C=f,I=g,j=x,h>=0?(v=c,M=l,P=u,k=d,N=p,T=_,B=m,D=y):(v=l,M=c,P=d,k=u,N=_,T=p,B=y,D=m)),U===0)return null;let H=v/U,Z=M/U,$=1/U,J=P-H*C,lt=k-Z*C,K=N-H*I,ct=T-Z*I,at=B-H*j,Pt=D-Z*j,_t=at*ct-Pt*K,Bt=J*Pt-lt*at,Pe=K*lt-ct*J;if(r){if(_t<0||Bt<0||Pe<0)return null}else if((_t<0||Bt<0||Pe<0)&&(_t>0||Bt>0||Pe>0))return null;let Ht=_t+Bt+Pe;if(Ht===0)return null;let he=$*(_t*C+Bt*I+Pe*j);return(Ht>0?he<0:he>0)?null:this.at(he/Ht,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Er=class extends Ai{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Qi,this.combine=Dl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Rm=new Vt,ts=new wr,Rc=new pi,Pm=new O,Pc=new O,Ic=new O,Lc=new O,ff=new O,Dc=new O,Im=new O,Nc=new O,Ge=class extends nn{constructor(t=new Ae,n=new Er){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,n){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;n.fromBufferAttribute(r,t);let a=this.morphTargetInfluences;if(s&&a){Dc.set(0,0,0);for(let c=0,l=s.length;c<l;c++){let h=a[c],u=s[c];h!==0&&(ff.fromBufferAttribute(u,t),o?Dc.addScaledVector(ff,h):Dc.addScaledVector(ff.sub(n),h))}n.add(Dc)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Rc.copy(i.boundingSphere),Rc.applyMatrix4(s),ts.copy(t.ray).recast(t.near),!(Rc.containsPoint(ts.origin)===!1&&(ts.intersectSphere(Rc,Pm)===null||ts.origin.distanceToSquared(Pm)>(t.far-t.near)**2))&&(Rm.copy(s).invert(),ts.copy(t.ray).applyMatrix4(Rm),!(i.boundingBox!==null&&ts.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,ts)))}_computeIntersections(t,n,i){let r,s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let p=0,_=d.length;p<_;p++){let g=d[p],m=o[g.materialIndex],y=Math.max(g.start,f.start),x=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let b=y,S=x;b<S;b+=3){let w=a.getX(b),v=a.getX(b+1),M=a.getX(b+2);r=Oc(this,m,t,i,l,h,u,w,v,M),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,n.push(r))}}else{let p=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let g=p,m=_;g<m;g+=3){let y=a.getX(g),x=a.getX(g+1),b=a.getX(g+2);r=Oc(this,o,t,i,l,h,u,y,x,b),r&&(r.faceIndex=Math.floor(g/3),n.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let p=0,_=d.length;p<_;p++){let g=d[p],m=o[g.materialIndex],y=Math.max(g.start,f.start),x=Math.min(c.count,Math.min(g.start+g.count,f.start+f.count));for(let b=y,S=x;b<S;b+=3){let w=b,v=b+1,M=b+2;r=Oc(this,m,t,i,l,h,u,w,v,M),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,n.push(r))}}else{let p=Math.max(0,f.start),_=Math.min(c.count,f.start+f.count);for(let g=p,m=_;g<m;g+=3){let y=g,x=g+1,b=g+2;r=Oc(this,o,t,i,l,h,u,y,x,b),r&&(r.faceIndex=Math.floor(g/3),n.push(r))}}}};function Nx(e,t,n,i,r,s,o,a){let c;if(t.side===rn?c=i.intersectTriangle(o,s,r,!0,a):c=i.intersectTriangle(r,s,o,t.side===Ir,a),c===null)return null;Nc.copy(a),Nc.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Nc);return l<n.near||l>n.far?null:{distance:l,point:Nc.clone(),object:e}}function Oc(e,t,n,i,r,s,o,a,c,l){e.getVertexPosition(a,Pc),e.getVertexPosition(c,Ic),e.getVertexPosition(l,Lc);let h=Nx(e,t,n,i,Pc,Ic,Lc,Im);if(h){let u=new O;Zi.getBarycoord(Im,Pc,Ic,Lc,u),r&&(h.uv=Zi.getInterpolatedAttribute(r,a,c,l,u,new ut)),s&&(h.uv1=Zi.getInterpolatedAttribute(s,a,c,l,u,new ut)),o&&(h.normal=Zi.getInterpolatedAttribute(o,a,c,l,u,new O),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new O,materialIndex:0};Zi.getNormal(Pc,Ic,Lc,d.normal),h.face=d,h.barycoord=u}return h}var sa=class extends fn{constructor(t=null,n=1,i=1,r,s,o,a,c,l=Ke,h=Ke,u,d){super(null,o,a,c,l,h,r,s,u,d),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var oa=class extends en{constructor(t,n,i,r=1){super(t,n,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},zs=new Vt,Lm=new Vt,Fc=[],Dm=new dn,Ox=new Vt,Go=new Ge,Vo=new pi,to=class extends Ge{constructor(t,n,i){super(t,n),this.isInstancedMesh=!0,this.instanceMatrix=new oa(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,Ox)}computeBoundingBox(){let t=this.geometry,n=this.count;this.boundingBox===null&&(this.boundingBox=new dn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<n;i++)this.getMatrixAt(i,zs),Dm.copy(t.boundingBox).applyMatrix4(zs),this.boundingBox.union(Dm)}computeBoundingSphere(){let t=this.geometry,n=this.count;this.boundingSphere===null&&(this.boundingSphere=new pi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<n;i++)this.getMatrixAt(i,zs),Vo.copy(t.boundingSphere).applyMatrix4(zs),this.boundingSphere.union(Vo)}copy(t,n){return super.copy(t,n),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,n){return this.instanceColor===null?n.setRGB(1,1,1):n.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,n){return n.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,n){let i=n.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,o=t*s+1;for(let a=0;a<i.length;a++)i[a]=r[o+a]}raycast(t,n){let i=this.matrixWorld,r=this.count;if(Go.geometry=this.geometry,Go.material=this.material,Go.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Vo.copy(this.boundingSphere),Vo.applyMatrix4(i),t.ray.intersectsSphere(Vo)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,zs),Lm.multiplyMatrices(i,zs),Go.matrixWorld=Lm,Go.raycast(t,Fc);for(let o=0,a=Fc.length;o<a;o++){let c=Fc[o];c.instanceId=s,c.object=this,n.push(c)}Fc.length=0}}setColorAt(t,n){return this.instanceColor===null&&(this.instanceColor=new oa(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),n.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,n){return n.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,n){let i=n.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new sa(new Float32Array(r*this.count),r,this.count,zl,ii));let s=this.morphTexture.source.data.data,o=0;for(let l=0;l<i.length;l++)o+=i[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=r*t;return s[c]=a,s.set(i,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},es=new pi,Fx=new ut(.5,.5),Uc=new O,Tr=class{constructor(t=new xn,n=new xn,i=new xn,r=new xn,s=new xn,o=new xn){this.planes=[t,n,i,r,s,o]}set(t,n,i,r,s,o){let a=this.planes;return a[0].copy(t),a[1].copy(n),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=ti,i=!1){let r=this.planes,s=t.elements,o=s[0],a=s[1],c=s[2],l=s[3],h=s[4],u=s[5],d=s[6],f=s[7],p=s[8],_=s[9],g=s[10],m=s[11],y=s[12],x=s[13],b=s[14],S=s[15];if(r[0].setComponents(l-o,f-h,m-p,S-y).normalize(),r[1].setComponents(l+o,f+h,m+p,S+y).normalize(),r[2].setComponents(l+a,f+u,m+_,S+x).normalize(),r[3].setComponents(l-a,f-u,m-_,S-x).normalize(),i)r[4].setComponents(c,d,g,b).normalize(),r[5].setComponents(l-c,f-d,m-g,S-b).normalize();else if(r[4].setComponents(l-c,f-d,m-g,S-b).normalize(),n===ti)r[5].setComponents(l+c,f+d,m+g,S+b).normalize();else if(n===qs)r[5].setComponents(c,d,g,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),es.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),es.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(es)}intersectsSprite(t){es.center.set(0,0,0);let n=Fx.distanceTo(t.center);return es.radius=.7071067811865476+n,es.applyMatrix4(t.matrixWorld),this.intersectsSphere(es)}intersectsSphere(t){let n=this.planes,i=t.center,r=-t.radius;for(let s=0;s<6;s++)if(n[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){let n=this.planes;for(let i=0;i<6;i++){let r=n[i];if(Uc.x=r.normal.x>0?t.max.x:t.min.x,Uc.y=r.normal.y>0?t.max.y:t.min.y,Uc.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(Uc)<0)return!1}return!0}containsPoint(t){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Nm=new Vt,ol=class e{constructor(){this.coordinateSystem=ti,this._frustums=[],this._count=0}setFromArrayCamera(t){let n=t.cameras,i=this._frustums;for(let r=0;r<n.length;r++){let s=n[r];Nm.multiplyMatrices(s.projectionMatrix,s.matrixWorldInverse),i[r]===void 0&&(i[r]=new Tr),i[r].setFromProjectionMatrix(Nm,s.coordinateSystem,s.reversedDepth)}return this._count=n.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsObject(t))return!0;return!1}intersectsSprite(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsSphere(t))return!0;return!1}intersectsBox(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsBox(t))return!0;return!1}containsPoint(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let n=this._frustums,i=t._frustums;for(let r=0;r<t._count;r++)n[r]===void 0&&(n[r]=new Tr),n[r].copy(i[r]);return this._count=t._count,this}clone(){return new e().copy(this)}};var Hn=class extends Ai{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Wt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},al=new O,cl=new O,Om=new Vt,Ho=new wr,kc=new pi,df=new O,Fm=new O,Ci=class extends nn{constructor(t=new Ae,n=new Hn){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let n=t.attributes.position,i=[0];for(let r=1,s=n.count;r<s;r++)al.fromBufferAttribute(n,r-1),cl.fromBufferAttribute(n,r),i[r]=i[r-1],i[r]+=al.distanceTo(cl);t.setAttribute("lineDistance",new de(i,1))}else Gt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,r=this.matrixWorld,s=t.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),kc.copy(i.boundingSphere),kc.applyMatrix4(r),kc.radius+=s,t.ray.intersectsSphere(kc)===!1)return;Om.copy(r).invert(),Ho.copy(t.ray).applyMatrix4(Om);let a=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=i.index,d=i.attributes.position;if(h!==null){let f=Math.max(0,o.start),p=Math.min(h.count,o.start+o.count);for(let _=f,g=p-1;_<g;_+=l){let m=h.getX(_),y=h.getX(_+1),x=Bc(this,t,Ho,c,m,y,_);x&&n.push(x)}if(this.isLineLoop){let _=h.getX(p-1),g=h.getX(f),m=Bc(this,t,Ho,c,_,g,p-1);m&&n.push(m)}}else{let f=Math.max(0,o.start),p=Math.min(d.count,o.start+o.count);for(let _=f,g=p-1;_<g;_+=l){let m=Bc(this,t,Ho,c,_,_+1,_);m&&n.push(m)}if(this.isLineLoop){let _=Bc(this,t,Ho,c,p-1,f,p-1);_&&n.push(_)}}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}};function Bc(e,t,n,i,r,s,o){let a=e.geometry.attributes.position;if(al.fromBufferAttribute(a,r),cl.fromBufferAttribute(a,s),n.distanceSqToSegment(al,cl,df,Fm)>i)return;df.applyMatrix4(e.matrixWorld);let l=t.ray.origin.distanceTo(df);if(!(l<t.near||l>t.far))return{distance:l,point:Fm.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var Um=new O,km=new O,eo=class extends Ci{constructor(t,n){super(t,n),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let n=t.attributes.position,i=[];for(let r=0,s=n.count;r<s;r+=2)Um.fromBufferAttribute(n,r),km.fromBufferAttribute(n,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Um.distanceTo(km);t.setAttribute("lineDistance",new de(i,1))}else Gt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var aa=class extends fn{constructor(t=[],n=cs,i,r,s,o,a,c,l,h){super(t,n,i,r,s,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},is=class extends fn{constructor(t,n,i,r,s,o,a,c,l){super(t,n,i,r,s,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var tr=class extends fn{constructor(t,n,i=mi,r,s,o,a=Ke,c=Ke,l,h=Ji,u=1){if(h!==Ji&&h!==rr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:t,height:n,depth:u};super(d,r,s,o,a,c,h,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ks(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}},ca=class extends tr{constructor(t,n=mi,i=cs,r,s,o=Ke,a=Ke,c,l=Ji){let h={width:t,height:t,depth:1},u=[h,h,h,h,h,h];super(t,t,n,i,r,s,o,a,c,l),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},la=class extends fn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},no=class e extends Ae{constructor(t=1,n=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};let a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);let c=[],l=[],h=[],u=[],d=0,f=0;p("z","y","x",-1,-1,i,n,t,o,s,0),p("z","y","x",1,-1,i,n,-t,o,s,1),p("x","z","y",1,1,t,i,n,r,o,2),p("x","z","y",1,-1,t,i,-n,r,o,3),p("x","y","z",1,-1,t,n,i,r,s,4),p("x","y","z",-1,-1,t,n,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new de(l,3)),this.setAttribute("normal",new de(h,3)),this.setAttribute("uv",new de(u,2));function p(_,g,m,y,x,b,S,w,v,M,U){let P=b/v,k=S/M,C=b/2,N=S/2,T=w/2,I=v+1,B=M+1,D=0,j=0,H=new O;for(let Z=0;Z<B;Z++){let $=Z*k-N;for(let J=0;J<I;J++){let lt=J*P-C;H[_]=lt*y,H[g]=$*x,H[m]=T,l.push(H.x,H.y,H.z),H[_]=0,H[g]=0,H[m]=w>0?1:-1,h.push(H.x,H.y,H.z),u.push(J/v),u.push(1-Z/M),D+=1}}for(let Z=0;Z<M;Z++)for(let $=0;$<v;$++){let J=d+$+I*Z,lt=d+$+I*(Z+1),K=d+($+1)+I*(Z+1),ct=d+($+1)+I*Z;c.push(J,lt,ct),c.push(lt,K,ct),j+=6}a.addGroup(f,j,U),f+=j,d+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var io=class e extends Ae{constructor(t=1,n=1,i=1,r=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:n,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};let l=this;r=Math.floor(r),s=Math.floor(s);let h=[],u=[],d=[],f=[],p=0,_=[],g=i/2,m=0;y(),o===!1&&(t>0&&x(!0),n>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new de(u,3)),this.setAttribute("normal",new de(d,3)),this.setAttribute("uv",new de(f,2));function y(){let b=new O,S=new O,w=0,v=(n-t)/i;for(let M=0;M<=s;M++){let U=[],P=M/s,k=P*(n-t)+t;for(let C=0;C<=r;C++){let N=C/r,T=N*c+a,I=Math.sin(T),B=Math.cos(T);S.x=k*I,S.y=-P*i+g,S.z=k*B,u.push(S.x,S.y,S.z),b.set(I,v,B).normalize(),d.push(b.x,b.y,b.z),f.push(N,1-P),U.push(p++)}_.push(U)}for(let M=0;M<r;M++)for(let U=0;U<s;U++){let P=_[U][M],k=_[U+1][M],C=_[U+1][M+1],N=_[U][M+1];(t>0||U!==0)&&(h.push(P,k,N),w+=3),(n>0||U!==s-1)&&(h.push(k,C,N),w+=3)}l.addGroup(m,w,0),m+=w}function x(b){let S=p,w=new ut,v=new O,M=0,U=b===!0?t:n,P=b===!0?1:-1;for(let C=1;C<=r;C++)u.push(0,g*P,0),d.push(0,P,0),f.push(.5,.5),p++;let k=p;for(let C=0;C<=r;C++){let T=C/r*c+a,I=Math.cos(T),B=Math.sin(T);v.x=U*B,v.y=g*P,v.z=U*I,u.push(v.x,v.y,v.z),d.push(0,P,0),w.x=I*.5+.5,w.y=B*.5*P+.5,f.push(w.x,w.y),p++}for(let C=0;C<r;C++){let N=S+C,T=k+C;b===!0?h.push(T,T+1,N):h.push(T+1,T,N),M+=3}l.addGroup(m,M,b===!0?1:2),m+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ha=class e extends io{constructor(t=1,n=1,i=32,r=1,s=!1,o=0,a=Math.PI*2){super(0,t,n,i,r,s,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:n,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ll=class e extends Ae{constructor(t=[],n=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:n,radius:i,detail:r};let s=[],o=[];a(r),l(i),h(),this.setAttribute("position",new de(s,3)),this.setAttribute("normal",new de(s.slice(),3)),this.setAttribute("uv",new de(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(y){let x=new O,b=new O,S=new O;for(let w=0;w<n.length;w+=3)f(n[w+0],x),f(n[w+1],b),f(n[w+2],S),c(x,b,S,y)}function c(y,x,b,S){let w=S+1,v=[];for(let M=0;M<=w;M++){v[M]=[];let U=y.clone().lerp(b,M/w),P=x.clone().lerp(b,M/w),k=w-M;for(let C=0;C<=k;C++)C===0&&M===w?v[M][C]=U:v[M][C]=U.clone().lerp(P,C/k)}for(let M=0;M<w;M++)for(let U=0;U<2*(w-M)-1;U++){let P=Math.floor(U/2);U%2===0?(d(v[M][P+1]),d(v[M+1][P]),d(v[M][P])):(d(v[M][P+1]),d(v[M+1][P+1]),d(v[M+1][P]))}}function l(y){let x=new O;for(let b=0;b<s.length;b+=3)x.x=s[b+0],x.y=s[b+1],x.z=s[b+2],x.normalize().multiplyScalar(y),s[b+0]=x.x,s[b+1]=x.y,s[b+2]=x.z}function h(){let y=new O;for(let x=0;x<s.length;x+=3){y.x=s[x+0],y.y=s[x+1],y.z=s[x+2];let b=g(y)/2/Math.PI+.5,S=m(y)/Math.PI+.5;o.push(b,1-S)}p(),u()}function u(){for(let y=0;y<o.length;y+=6){let x=o[y+0],b=o[y+2],S=o[y+4],w=Math.max(x,b,S),v=Math.min(x,b,S);w>.9&&v<.1&&(x<.2&&(o[y+0]+=1),b<.2&&(o[y+2]+=1),S<.2&&(o[y+4]+=1))}}function d(y){s.push(y.x,y.y,y.z)}function f(y,x){let b=y*3;x.x=t[b+0],x.y=t[b+1],x.z=t[b+2]}function p(){let y=new O,x=new O,b=new O,S=new O,w=new ut,v=new ut,M=new ut;for(let U=0,P=0;U<s.length;U+=9,P+=6){y.set(s[U+0],s[U+1],s[U+2]),x.set(s[U+3],s[U+4],s[U+5]),b.set(s[U+6],s[U+7],s[U+8]),w.set(o[P+0],o[P+1]),v.set(o[P+2],o[P+3]),M.set(o[P+4],o[P+5]),S.copy(y).add(x).add(b).divideScalar(3);let k=g(S);_(w,P+0,y,k),_(v,P+2,x,k),_(M,P+4,b,k)}}function _(y,x,b,S){S<0&&y.x===1&&(o[x]=y.x-1),b.x===0&&b.z===0&&(o[x]=S/2/Math.PI+.5)}function g(y){return Math.atan2(y.z,-y.x)}function m(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}};var ei=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Gt("Curve: .getPoint() not implemented.")}getPointAt(t,n){let i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let n=[],i,r=this.getPoint(0),s=0;n.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),s+=i.distanceTo(r),n.push(s),r=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){let i=this.getLengths(),r=0,s=i.length,o;n?o=n:o=t*i[s-1];let a=0,c=s-1,l;for(;a<=c;)if(r=Math.floor(a+(c-a)/2),l=i[r]-o,l<0)a=r+1;else if(l>0)c=r-1;else{c=r;break}if(r=c,i[r]===o)return r/(s-1);let h=i[r],d=i[r+1]-h,f=(o-h)/d;return(r+f)/(s-1)}getTangent(t,n){let r=t-1e-4,s=t+1e-4;r<0&&(r=0),s>1&&(s=1);let o=this.getPoint(r),a=this.getPoint(s),c=n||(o.isVector2?new ut:new O);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,n){let i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){let i=new O,r=[],s=[],o=[],a=new O,c=new Vt;for(let f=0;f<=t;f++){let p=f/t;r[f]=this.getTangentAt(p,new O)}s[0]=new O,o[0]=new O;let l=Number.MAX_VALUE,h=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);h<=l&&(l=h,i.set(1,0,0)),u<=l&&(l=u,i.set(0,1,0)),d<=l&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let f=1;f<=t;f++){if(s[f]=s[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(r[f-1],r[f]),a.length()>Number.EPSILON){a.normalize();let p=Math.acos(ee(r[f-1].dot(r[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(a,p))}o[f].crossVectors(r[f],s[f])}if(n===!0){let f=Math.acos(ee(s[0].dot(s[t]),-1,1));f/=t,r[0].dot(a.crossVectors(s[0],s[t]))>0&&(f=-f);for(let p=1;p<=t;p++)s[p].applyMatrix4(c.makeRotationAxis(r[p],f*p)),o[p].crossVectors(r[p],s[p])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},Ri=class extends ei{constructor(t=0,n=0,i=1,r=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=n,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,n=new ut){let i=n,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(o?s=0:s=r),this.aClockwise===!0&&!o&&(s===r?s=-r:s=s-r);let a=this.aStartAngle+t*s,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=c-this.aX,f=l-this.aY;c=d*h-f*u+this.aX,l=d*u+f*h+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},hl=class extends Ri{constructor(t,n,i,r,s,o){super(t,n,i,i,r,s,o),this.isArcCurve=!0,this.type="ArcCurve"}};function ed(){let e=0,t=0,n=0,i=0;function r(s,o,a,c){e=s,t=a,n=-3*s+3*o-2*a-c,i=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){r(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,h,u){let d=(o-s)/l-(a-s)/(l+h)+(a-o)/h,f=(a-o)/h-(c-o)/(h+u)+(c-a)/u;d*=h,f*=h,r(o,a,d,f)},calc:function(s){let o=s*s,a=o*s;return e+t*s+n*o+i*a}}}var Bm=new O,zm=new O,pf=new ed,mf=new ed,gf=new ed,ul=class extends ei{constructor(t=[],n=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=n,this.curveType=i,this.tension=r}getPoint(t,n=new O){let i=n,r=this.points,s=r.length,o=(s-(this.closed?0:1))*t,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,h;this.closed||a>0?l=r[(a-1)%s]:(zm.subVectors(r[0],r[1]).add(r[0]),l=zm);let u=r[a%s],d=r[(a+1)%s];if(this.closed||a+2<s?h=r[(a+2)%s]:(Bm.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=Bm),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,p=Math.pow(l.distanceToSquared(u),f),_=Math.pow(u.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(h),f);_<1e-4&&(_=1),p<1e-4&&(p=_),g<1e-4&&(g=_),pf.initNonuniformCatmullRom(l.x,u.x,d.x,h.x,p,_,g),mf.initNonuniformCatmullRom(l.y,u.y,d.y,h.y,p,_,g),gf.initNonuniformCatmullRom(l.z,u.z,d.z,h.z,p,_,g)}else this.curveType==="catmullrom"&&(pf.initCatmullRom(l.x,u.x,d.x,h.x,this.tension),mf.initCatmullRom(l.y,u.y,d.y,h.y,this.tension),gf.initCatmullRom(l.z,u.z,d.z,h.z,this.tension));return i.set(pf.calc(c),mf.calc(c),gf.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){let r=t.points[n];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){let r=this.points[n];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){let r=t.points[n];this.points.push(new O().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Gm(e,t,n,i,r){let s=(i-t)*.5,o=(r-n)*.5,a=e*e,c=e*a;return(2*n-2*i+s+o)*c+(-3*n+3*i-2*s-o)*a+s*e+n}function Ux(e,t){let n=1-e;return n*n*t}function kx(e,t){return 2*(1-e)*e*t}function Bx(e,t){return e*e*t}function qo(e,t,n,i){return Ux(e,t)+kx(e,n)+Bx(e,i)}function zx(e,t){let n=1-e;return n*n*n*t}function Gx(e,t){let n=1-e;return 3*n*n*e*t}function Vx(e,t){return 3*(1-e)*e*e*t}function Hx(e,t){return e*e*e*t}function Xo(e,t,n,i,r){return zx(e,t)+Gx(e,n)+Vx(e,i)+Hx(e,r)}var fl=class extends ei{constructor(t=new ut,n=new ut,i=new ut,r=new ut){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=n,this.v2=i,this.v3=r}getPoint(t,n=new ut){let i=n,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(Xo(t,r.x,s.x,o.x,a.x),Xo(t,r.y,s.y,o.y,a.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},ro=class extends ei{constructor(t=new O,n=new O,i=new O,r=new O){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=n,this.v2=i,this.v3=r}getPoint(t,n=new O){let i=n,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(Xo(t,r.x,s.x,o.x,a.x),Xo(t,r.y,s.y,o.y,a.y),Xo(t,r.z,s.z,o.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},dl=class extends ei{constructor(t=new ut,n=new ut){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=n}getPoint(t,n=new ut){let i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new ut){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},pl=class extends ei{constructor(t=new O,n=new O){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=n}getPoint(t,n=new O){let i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new O){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},ml=class extends ei{constructor(t=new ut,n=new ut,i=new ut){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new ut){let i=n,r=this.v0,s=this.v1,o=this.v2;return i.set(qo(t,r.x,s.x,o.x),qo(t,r.y,s.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},rs=class extends ei{constructor(t=new O,n=new O,i=new O){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new O){let i=n,r=this.v0,s=this.v1,o=this.v2;return i.set(qo(t,r.x,s.x,o.x),qo(t,r.y,s.y,o.y),qo(t,r.z,s.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},gl=class extends ei{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,n=new ut){let i=n,r=this.points,s=(r.length-1)*t,o=Math.floor(s),a=s-o,c=r[o===0?o:o-1],l=r[o],h=r[o>r.length-2?r.length-1:o+1],u=r[o>r.length-3?r.length-1:o+2];return i.set(Gm(a,c.x,l.x,h.x,u.x),Gm(a,c.y,l.y,h.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){let r=t.points[n];this.points.push(r.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){let r=this.points[n];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){let r=t.points[n];this.points.push(new ut().fromArray(r))}return this}},Wx=Object.freeze({__proto__:null,ArcCurve:hl,CatmullRomCurve3:ul,CubicBezierCurve:fl,CubicBezierCurve3:ro,EllipseCurve:Ri,LineCurve:dl,LineCurve3:pl,QuadraticBezierCurve:ml,QuadraticBezierCurve3:rs,SplineCurve:gl});var ua=class e extends ll{constructor(t=1,n=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,t,n),this.type="OctahedronGeometry",this.parameters={radius:t,detail:n}}static fromJSON(t){return new e(t.radius,t.detail)}},fa=class e extends Ae{constructor(t=1,n=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:r};let s=t/2,o=n/2,a=Math.floor(i),c=Math.floor(r),l=a+1,h=c+1,u=t/a,d=n/c,f=[],p=[],_=[],g=[];for(let m=0;m<h;m++){let y=m*d-o;for(let x=0;x<l;x++){let b=x*u-s;p.push(b,-y,0),_.push(0,0,1),g.push(x/a),g.push(1-m/c)}}for(let m=0;m<c;m++)for(let y=0;y<a;y++){let x=y+l*m,b=y+l*(m+1),S=y+1+l*(m+1),w=y+1+l*m;f.push(x,b,w),f.push(b,S,w)}this.setIndex(f),this.setAttribute("position",new de(p,3)),this.setAttribute("normal",new de(_,3)),this.setAttribute("uv",new de(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};var Pi=class e extends Ae{constructor(t=1,n=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));let c=Math.min(o+a,Math.PI),l=0,h=[],u=new O,d=new O,f=[],p=[],_=[],g=[];for(let m=0;m<=i;m++){let y=[],x=m/i,b=o+x*a,S=t*Math.cos(b),w=Math.sqrt(t*t-S*S),v=0;m===0&&o===0?v=.5/n:m===i&&c===Math.PI&&(v=-.5/n);for(let M=0;M<=n;M++){let U=M/n,P=r+U*s;u.x=-w*Math.cos(P),u.y=S,u.z=w*Math.sin(P),p.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),g.push(U+v,1-x),y.push(l++)}h.push(y)}for(let m=0;m<i;m++)for(let y=0;y<n;y++){let x=h[m][y+1],b=h[m][y],S=h[m+1][y],w=h[m+1][y+1];(m!==0||o>0)&&f.push(x,b,w),(m!==i-1||c<Math.PI)&&f.push(b,S,w)}this.setIndex(f),this.setAttribute("position",new de(p,3)),this.setAttribute("normal",new de(_,3)),this.setAttribute("uv",new de(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var da=class e extends Ae{constructor(t=new rs(new O(-1,-1,0),new O(-1,1,0),new O(1,1,0)),n=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:n,radius:i,radialSegments:r,closed:s};let o=t.computeFrenetFrames(n,s);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new O,c=new O,l=new ut,h=new O,u=[],d=[],f=[],p=[];_(),this.setIndex(p),this.setAttribute("position",new de(u,3)),this.setAttribute("normal",new de(d,3)),this.setAttribute("uv",new de(f,2));function _(){for(let x=0;x<n;x++)g(x);g(s===!1?n:0),y(),m()}function g(x){h=t.getPointAt(x/n,h);let b=o.normals[x],S=o.binormals[x];for(let w=0;w<=r;w++){let v=w/r*Math.PI*2,M=Math.sin(v),U=-Math.cos(v);c.x=U*b.x+M*S.x,c.y=U*b.y+M*S.y,c.z=U*b.z+M*S.z,c.normalize(),d.push(c.x,c.y,c.z),a.x=h.x+i*c.x,a.y=h.y+i*c.y,a.z=h.z+i*c.z,u.push(a.x,a.y,a.z)}}function m(){for(let x=1;x<=n;x++)for(let b=1;b<=r;b++){let S=(r+1)*(x-1)+(b-1),w=(r+1)*x+(b-1),v=(r+1)*x+b,M=(r+1)*(x-1)+b;p.push(S,w,M),p.push(w,v,M)}}function y(){for(let x=0;x<=n;x++)for(let b=0;b<=r;b++)l.x=x/n,l.y=b/r,f.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new e(new Wx[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};function hs(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let r=e[n][i];if(Vm(r))r.isRenderTargetTexture?(Gt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=r.clone();else if(Array.isArray(r))if(Vm(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();t[n][i]=s}else t[n][i]=r.slice();else t[n][i]=r}}return t}function pn(e){let t={};for(let n=0;n<e.length;n++){let i=hs(e[n]);for(let r in i)t[r]=i[r]}return t}function Vm(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function $x(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function nd(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:se.workingColorSpace}var Mh={clone:hs,merge:pn},jx=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qx=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Wn=class extends Ai{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=jx,this.fragmentShader=qx,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=hs(t.uniforms),this.uniformsGroups=$x(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(let r in this.uniforms){let o=this.uniforms[r].value;o&&o.isTexture?n.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?n.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?n.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?n.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?n.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?n.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?n.uniforms[r]={type:"m4",value:o.toArray()}:n.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(let i in t.uniforms){let r=t.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=n[r.value]||null;break;case"c":this.uniforms[i].value=new Wt().setHex(r.value);break;case"v2":this.uniforms[i].value=new ut().fromArray(r.value);break;case"v3":this.uniforms[i].value=new O().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Ie().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Yt().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Vt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},_l=class extends Wn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ar=class extends Ai{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=bh,this.normalScale=new ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Qi,this.combine=Dl,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},yl=class extends Ai{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Mg,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},vl=class extends Ai{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Gs(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function zc(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Cr=class{constructor(t,n,i,r){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let n=this.parameterPositions,i=this._cachedIndex,r=n[i],s=n[i-1];t:{e:{let o;n:{i:if(!(t<r)){for(let a=i+2;;){if(r===void 0){if(t<s)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(s=r,r=n[++i],t<r)break e}o=n.length;break n}if(!(t>=s)){let a=n[1];t<a&&(i=2,s=a);for(let c=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(r=s,s=n[--i-1],t>=s)break e}o=i,i=0;break n}break t}for(;i<o;){let a=i+o>>>1;t<n[a]?o=a:i=a+1}if(r=n[i],s=n[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,t,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let n=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=t*r;for(let o=0;o!==r;++o)n[o]=i[s+o];return n}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},bl=class extends Cr{constructor(t,n,i,r){super(t,n,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:vf,endingEnd:vf}}intervalChanged_(t,n,i){let r=this.parameterPositions,s=t-2,o=t+1,a=r[s],c=r[o];if(a===void 0)switch(this.getSettings_().endingStart){case bf:s=t,a=2*n-i;break;case xf:s=r.length-2,a=n+r[s]-r[s+1];break;default:s=t,a=i}if(c===void 0)switch(this.getSettings_().endingEnd){case bf:o=t,c=2*i-n;break;case xf:o=1,c=i+r[1]-r[0];break;default:o=t-1,c=n}let l=(i-n)*.5,h=this.valueSize;this._weightPrev=l/(n-a),this._weightNext=l/(c-i),this._offsetPrev=s*h,this._offsetNext=o*h}interpolate_(t,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(i-n)/(r-n),_=p*p,g=_*p,m=-d*g+2*d*_-d*p,y=(1+d)*g+(-1.5-2*d)*_+(-.5+d)*p+1,x=(-1-f)*g+(1.5+f)*_+.5*p,b=f*g-f*_;for(let S=0;S!==a;++S)s[S]=m*o[h+S]+y*o[l+S]+x*o[c+S]+b*o[u+S];return s}},xl=class extends Cr{constructor(t,n,i,r){super(t,n,i,r)}interpolate_(t,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=(i-n)/(r-n),u=1-h;for(let d=0;d!==a;++d)s[d]=o[l+d]*u+o[c+d]*h;return s}},Ml=class extends Cr{constructor(t,n,i,r){super(t,n,i,r)}interpolate_(t){return this.copySampleValue_(t-1)}},Sl=class extends Cr{interpolate_(t,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(i-n)/(r-n),_=1-p;for(let g=0;g!==a;++g)s[g]=o[l+g]*_+o[c+g]*p;return s}let d=a*2,f=t-1;for(let p=0;p!==a;++p){let _=o[l+p],g=o[c+p],m=f*d+p*2,y=u[m],x=u[m+1],b=t*d+p*2,S=h[b],w=h[b+1],v=Yx(i,n,y,S,r);s[p]=Fg(v,_,x,w,g)}return s}};function Fg(e,t,n,i,r){let s=1-e;return s*s*s*t+3*s*s*e*n+3*s*e*e*i+e*e*e*r}function Xx(e,t,n,i,r){let s=1-e;return 3*s*s*(n-t)+6*s*e*(i-n)+3*e*e*(r-i)}function Yx(e,t,n,i,r){let s=(e-t)/(r-t);for(let o=0;o<8;o++){let a=Fg(s,t,n,i,r)-e;if(Math.abs(a)<1e-10)break;let c=Xx(s,t,n,i,r);if(Math.abs(c)<1e-10)break;s=Math.max(0,Math.min(1,s-a/c))}return s}var $n=class{constructor(t,n,i,r){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Gs(n,this.TimeBufferType),this.values=Gs(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(t){let n=t.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(t);else{i={name:t.name,times:Gs(t.times,Array),values:Gs(t.values,Array)};let r=t.getInterpolation();r!==t.DefaultInterpolation&&(i.interpolation=r),zc(t.settings)&&(i.settings={inTangents:Gs(t.settings.inTangents,Array),outTangents:Gs(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Ml(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new xl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new bl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let n=new Sl(this.times,this.values,this.getValueSize(),t);return this.settings&&(n.inTangents=this.settings.inTangents,n.outTangents=this.settings.outTangents),n}setInterpolation(t){let n;switch(t){case Yo:n=this.InterpolantFactoryMethodDiscrete;break;case el:n=this.InterpolantFactoryMethodLinear;break;case Hc:n=this.InterpolantFactoryMethodSmooth;break;case yf:n=this.InterpolantFactoryMethodBezier;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Gt("KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Yo;case this.InterpolantFactoryMethodLinear:return el;case this.InterpolantFactoryMethodSmooth:return Hc;case this.InterpolantFactoryMethodBezier:return yf}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let n=this.times;for(let i=0,r=n.length;i!==r;++i)n[i]+=t;zc(this.settings)&&(Hm(this.settings.inTangents,t),Hm(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let n=this.times;for(let i=0,r=n.length;i!==r;++i)n[i]*=t;zc(this.settings)&&(Wm(this.settings.inTangents,t),Wm(this.settings.outTangents,t))}return this}trim(t,n){let i=this.times,r=i.length,s=0,o=r-1;for(;s!==r&&i[s]<t;)++s;for(;o!==-1&&i[o]>n;)--o;if(++o,s!==0||o!==r){s>=o&&(o=Math.max(o,1),s=o-1);let a=this.getValueSize();this.times=i.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let t=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(qt("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,r=this.values,s=i.length;s===0&&(qt("KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==s;a++){let c=i[a];if(typeof c=="number"&&isNaN(c)){qt("KeyframeTrack: Time is not a valid number.",this,a,c),t=!1;break}if(o!==null&&o>c){qt("KeyframeTrack: Out of order keys.",this,a,c,o),t=!1;break}o=c}if(r!==void 0&&nx(r))for(let a=0,c=r.length;a!==c;++a){let l=r[a];if(isNaN(l)){qt("KeyframeTrack: Value is not a valid number.",this,a,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Hc,s=t.length-1,o=1;for(let a=1;a<s;++a){let c=!1,l=t[a],h=t[a+1];if(l!==h&&(a!==1||l!==t[0]))if(r)c=!0;else{let u=a*i,d=u-i,f=u+i;for(let p=0;p!==i;++p){let _=n[u+p];if(_!==n[d+p]||_!==n[f+p]){c=!0;break}}}if(c){if(a!==o){t[o]=t[a];let u=a*i,d=o*i;for(let f=0;f!==i;++f)n[d+f]=n[u+f]}++o}}if(s>0){t[o]=t[s];for(let a=s*i,c=o*i,l=0;l!==i;++l)n[c+l]=n[a+l];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=n.slice(0,o*i)):(this.times=t,this.values=n),this}clone(){let t=this.times.slice(),n=this.values.slice(),i=this.constructor,r=new i(this.name,t,n);return r.createInterpolant=this.createInterpolant,zc(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Hm(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]+=t}function Wm(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}$n.prototype.ValueTypeName="";$n.prototype.TimeBufferType=Float32Array;$n.prototype.ValueBufferType=Float32Array;$n.prototype.DefaultInterpolation=el;var Rr=class extends $n{constructor(t,n,i){super(t,n,i)}};Rr.prototype.ValueTypeName="bool";Rr.prototype.ValueBufferType=Array;Rr.prototype.DefaultInterpolation=Yo;Rr.prototype.InterpolantFactoryMethodLinear=void 0;Rr.prototype.InterpolantFactoryMethodSmooth=void 0;var wl=class extends $n{constructor(t,n,i,r){super(t,n,i,r)}};wl.prototype.ValueTypeName="color";var El=class extends $n{constructor(t,n,i,r){super(t,n,i,r)}};El.prototype.ValueTypeName="number";var Tl=class extends Cr{constructor(t,n,i,r){super(t,n,i,r)}interpolate_(t,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(i-n)/(r-n),l=t*a;for(let h=l+a;l!==h;l+=4)ze.slerpFlat(s,0,o,l-a,o,l,c);return s}},pa=class extends $n{constructor(t,n,i,r){super(t,n,i,r)}InterpolantFactoryMethodLinear(t){return new Tl(this.times,this.values,this.getValueSize(),t)}};pa.prototype.ValueTypeName="quaternion";pa.prototype.InterpolantFactoryMethodSmooth=void 0;var Pr=class extends $n{constructor(t,n,i){super(t,n,i)}};Pr.prototype.ValueTypeName="string";Pr.prototype.ValueBufferType=Array;Pr.prototype.DefaultInterpolation=Yo;Pr.prototype.InterpolantFactoryMethodLinear=void 0;Pr.prototype.InterpolantFactoryMethodSmooth=void 0;var Al=class extends $n{constructor(t,n,i,r){super(t,n,i,r)}};Al.prototype.ValueTypeName="vector";var $c={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&($m(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!$m(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function $m(e){try{let t=e.slice(e.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}var Cl=class{constructor(t,n,i){let r=this,s=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(h){a++,s===!1&&r.onStart!==void 0&&r.onStart(h,o,a),s=!0},this.itemEnd=function(h){o++,r.onProgress!==void 0&&r.onProgress(h,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){let f=l[u],p=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Ug=new Cl,so=class{constructor(t){this.manager=t!==void 0?t:Ug,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,n){let i=this;return new Promise(function(r,s){i.load(t,r,n,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};so.DEFAULT_MATERIAL_NAME="__DEFAULT";var Vs=new WeakMap,Rl=class extends so{constructor(t){super(t)}load(t,n,i,r){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let s=this,o=$c.get(`image:${t}`);if(o!==void 0){if(o.complete===!0)s.manager.itemStart(t),setTimeout(function(){n&&n(o),s.manager.itemEnd(t)},0);else{let u=Vs.get(o);u===void 0&&(u=[],Vs.set(o,u)),u.push({onLoad:n,onError:r})}return o}let a=Xs("img");function c(){h(),n&&n(this);let u=Vs.get(this)||[];for(let d=0;d<u.length;d++){let f=u[d];f.onLoad&&f.onLoad(this)}Vs.delete(this),s.manager.itemEnd(t)}function l(u){h(),r&&r(u),$c.remove(`image:${t}`);let d=Vs.get(this)||[];for(let f=0;f<d.length;f++){let p=d[f];p.onError&&p.onError(u)}Vs.delete(this),s.manager.itemError(t),s.manager.itemEnd(t)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),$c.add(`image:${t}`,a),s.manager.itemStart(t),a.fetchPriority=this.priority,a.src=t,a}};var ma=class extends so{constructor(t){super(t)}load(t,n,i,r){let s=new fn,o=new Rl(this.manager);return o.setPriority(this.priority),o.setCache(this.cache),o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(t,function(a){s.image=a,s.needsUpdate=!0,n!==void 0&&n(s)},i,r),s}},ga=class extends nn{static registerNode(t){this.prototype._lightNode=t}constructor(t,n=1){super(),this.isLight=!0,this.type="Light",this.color=new Wt(t),this.intensity=n}copy(t,n){return super.copy(t,n),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let n=super.toJSON(t);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}};var _f=new Vt,jm=new O,qm=new O,Pl=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ut(512,512),this.mapType=Ln,this.map=null,this.mapPass=null,this.matrix=new Vt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Tr,this._frameExtents=new ut(1,1),this._viewportCount=1,this._viewports=[new Ie(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let n=this.camera;jm.setFromMatrixPosition(t.matrixWorld),n.position.copy(jm),qm.setFromMatrixPosition(t.target.matrixWorld),n.lookAt(qm),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(t,n,i,r){_f.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(_f,t.coordinateSystem,t.reversedDepth);let s=this._frameExtents,o=r?r.z/s.x:1,a=r?r.w/s.y:1,c=r?r.x/s.x:0,l=r?r.y/s.y:0;t.coordinateSystem===qs||t.reversedDepth?n.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):n.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),n.multiply(_f)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Gc=new O,Vc=new ze,Ei=new O,_a=class extends nn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Vt,this.projectionMatrix=new Vt,this.projectionMatrixInverse=new Vt,this.coordinateSystem=ti,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Gc,Vc,Ei),Ei.x===1&&Ei.y===1&&Ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Gc,Vc,Ei.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(Gc,Vc,Ei),Ei.x===1&&Ei.y===1&&Ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Gc,Vc,Ei.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Mr=new O,Xm=new ut,Ym=new ut,Mn=class extends _a{constructor(t=50,n=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let n=.5*this.getFilmHeight()/t;this.fov=Zs*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan($o*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Zs*2*Math.atan(Math.tan($o*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){Mr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mr.x,Mr.y).multiplyScalar(-t/Mr.z),Mr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Mr.x,Mr.y).multiplyScalar(-t/Mr.z)}getViewSize(t,n){return this.getViewBounds(t,Xm,Ym),n.subVectors(Ym,Xm)}setViewOffset(t,n,i,r,s,o){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,n=t*Math.tan($o*.5*this.fov)/this.zoom,i=2*n,r=this.aspect*i,s=-.5*r,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,n-=o.offsetY*i/l,r*=o.width/c,i*=o.height/l}let a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}};var ss=class extends _a{constructor(t=-1,n=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-t,o=i+t,a=r+n,c=r-n;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}},Mf=class extends Pl{constructor(){super(new ss(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ya=class extends ga{constructor(t,n){super(t,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(nn.DEFAULT_UP),this.updateMatrix(),this.target=new nn,this.shadow=new Mf}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let n=super.toJSON(t);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}},va=class extends ga{constructor(t,n){super(t,n),this.isAmbientLight=!0,this.type="AmbientLight"}};var Hs=-90,Ws=1,oo=class extends nn{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Mn(Hs,Ws,t,n);r.layers=this.layers,this.add(r);let s=new Mn(Hs,Ws,t,n);s.layers=this.layers,this.add(s);let o=new Mn(Hs,Ws,t,n);o.layers=this.layers,this.add(o);let a=new Mn(Hs,Ws,t,n);a.layers=this.layers,this.add(a);let c=new Mn(Hs,Ws,t,n);c.layers=this.layers,this.add(c);let l=new Mn(Hs,Ws,t,n);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,n=this.children.concat(),[i,r,s,o,a,c]=n;for(let l of n)this.remove(l);if(t===ti)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===qs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let l of n)this.add(l),l.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[s,o,a,c,l,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;let _=i.texture.mipmapsAutoUpdate;i.texture.mipmapsAutoUpdate=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(i,0,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,s),t.setRenderTarget(i,1,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,2,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,3,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),t.setRenderTarget(i,4,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),i.texture.mipmapsAutoUpdate=_,t.setRenderTarget(i,5,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,h),t.setRenderTarget(u,d,f),t.xr.enabled=p,i.texture.needsPMREMUpdate=!0}},Il=class extends Mn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},os=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=Zx.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Zx(){this._document.hidden===!1&&this.reset()}var id="\\[\\]\\.:\\/",Kx=new RegExp("["+id+"]","g"),rd="[^"+id+"]",Jx="[^"+id.replace("\\.","")+"]",Qx=/((?:WC+[\/:])*)/.source.replace("WC",rd),t1=/(WCOD+)?/.source.replace("WCOD",Jx),e1=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",rd),n1=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",rd),i1=new RegExp("^"+Qx+t1+e1+n1+"$"),r1=["material","materials","bones","map"],Sf=class{constructor(t,n,i){let r=i||Re.parseTrackName(n);this._targetGroup=t,this._bindings=t.subscribe_(n,r)}getValue(t,n){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(t,n)}setValue(t,n){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(t,n)}bind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].bind()}unbind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].unbind()}},Re=class e{constructor(t,n,i){this.path=n,this.parsedPath=i||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,i){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,i):new e(t,n,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Kx,"")}static parseTrackName(t){let n=i1.exec(t);if(n===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);r1.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,n){if(n===void 0||n===""||n==="."||n===-1||n===t.name||n===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(n);if(i!==void 0)return i}if(t.children){let i=function(s){for(let o=0;o<s.length;o++){let a=s[o];if(a.name===n||a.uuid===n)return a;let c=i(a.children);if(c)return c}return null},r=i(t.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,n){t[n]=this.targetObject[this.propertyName]}_getValue_array(t,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)t[n++]=i[r]}_getValue_arrayElement(t,n){t[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,n){this.resolvedProperty.toArray(t,n)}_setValue_direct(t,n){this.targetObject[this.propertyName]=t[n]}_setValue_direct_setNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=t[n++]}_setValue_array_setNeedsUpdate(t,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=t[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=t[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,n){this.resolvedProperty[this.propertyIndex]=t[n]}_setValue_arrayElement_setNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,n){this.resolvedProperty.fromArray(t,n)}_setValue_fromArray_setNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,n){this.bind(),this.getValue(t,n)}_setValue_unbound(t,n){this.bind(),this.setValue(t,n)}bind(){let t=this.node,n=this.parsedPath,i=n.objectName,r=n.propertyName,s=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Gt("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=n.objectIndex;switch(i){case"materials":if(!t.material){qt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){qt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){qt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===l){l=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){qt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){qt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){qt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(l!==void 0){if(t[l]===void 0){qt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let o=t[r];if(o===void 0){let l=n.nodeName;qt("PropertyBinding: Trying to update property for track: "+l+"."+r+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!t.geometry){qt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){qt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Re.Composite=Sf;Re.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Re.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Re.prototype.GetterByBindingType=[Re.prototype._getValue_direct,Re.prototype._getValue_array,Re.prototype._getValue_arrayElement,Re.prototype._getValue_toArray];Re.prototype.SetterByBindingTypeAndVersioning=[[Re.prototype._setValue_direct,Re.prototype._setValue_direct_setNeedsUpdate,Re.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_array,Re.prototype._setValue_array_setNeedsUpdate,Re.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_arrayElement,Re.prototype._setValue_arrayElement_setNeedsUpdate,Re.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_fromArray,Re.prototype._setValue_fromArray_setNeedsUpdate,Re.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var DI=new Float32Array(1);var Zm=new Vt,er=class{constructor(t,n,i=0,r=1/0){this.ray=new wr(t,n),this.near=i,this.far=r,this.camera=null,this.layers=new Js,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,n){this.ray.set(t,n)}setFromCamera(t,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):qt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(t){return Zm.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Zm),this}intersectObject(t,n=!0,i=[]){return wf(t,this,i,n),i.sort(Km),i}intersectObjects(t,n=!0,i=[]){for(let r=0,s=t.length;r<s;r++)wf(t[r],this,i,n);return i.sort(Km),i}};function Km(e,t){return e.distance-t.distance}function wf(e,t,n,i){let r=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(r=!1),r===!0&&i===!0){let s=e.children;for(let o=0,a=s.length;o<a;o++)wf(s[o],t,n,!0)}}var ao=class{constructor(t=1,n=0,i=0){this.radius=t,this.phi=n,this.theta=i}set(t,n,i){return this.radius=t,this.phi=n,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=ee(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,n,i){return this.radius=Math.sqrt(t*t+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(ee(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var hd=class hd{constructor(t,n,i,r){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,r){let s=this.elements;return s[0]=t,s[2]=n,s[1]=i,s[3]=r,this}};hd.prototype.isMatrix2=!0;var Ef=hd;var ba=class extends eo{constructor(t=10,n=10,i=4473924,r=8947848){i=new Wt(i),r=new Wt(r);let s=n/2,o=t/n,a=t/2,c=[],l=[];for(let d=0,f=0,p=-a;d<=n;d++,p+=o){c.push(-a,0,p,a,0,p),c.push(p,0,-a,p,0,a);let _=d===s?i:r;_.toArray(l,f),f+=3,_.toArray(l,f),f+=3,_.toArray(l,f),f+=3,_.toArray(l,f),f+=3}let h=new Ae;h.setAttribute("position",new de(c,3)),h.setAttribute("color",new de(l,3));let u=new Hn({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var jn=class extends di{constructor(t,n=null){super(),this.object=t,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function sd(e,t,n,i){let r=s1(i);switch(n){case Wf:return e*t;case zl:return e*t/r.components*r.byteLength;case Gl:return e*t/r.components*r.byteLength;case Lr:return e*t*2/r.components*r.byteLength;case Vl:return e*t*2/r.components*r.byteLength;case $f:return e*t*3/r.components*r.byteLength;case gi:return e*t*4/r.components*r.byteLength;case Hl:return e*t*4/r.components*r.byteLength;case Sa:case wa:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ea:case Ta:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case $l:case ql:return Math.max(e,16)*Math.max(t,8)/4;case Wl:case jl:return Math.max(e,8)*Math.max(t,8)/2;case Xl:case Yl:case Kl:case Jl:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Zl:case Aa:case Ql:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case th:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case eh:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case nh:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case ih:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case rh:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case sh:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case oh:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case ah:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case ch:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case lh:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case hh:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case uh:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case fh:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case dh:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case ph:case mh:case gh:return Math.ceil(e/4)*Math.ceil(t/4)*16;case _h:case yh:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Ca:case vh:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function s1(e){switch(e){case Ln:case zf:return{byteLength:1,components:1};case uo:case Gf:case qn:return{byteLength:2,components:1};case kl:case Bl:return{byteLength:2,components:4};case mi:case Ul:case ii:return{byteLength:4,components:1};case Vf:case Hf:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Gt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function s0(){let e=null,t=!1,n=null,i=null;function r(s,o){i=e.requestAnimationFrame(r),n(s,o)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(r),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){n=s},setContext:function(s){e=s}}}function o1(e){let t=new WeakMap;function n(a,c){let l=a.array,h=a.usage,u=l.byteLength,d=e.createBuffer();e.bindBuffer(c,d),e.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=e.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=e.HALF_FLOAT:f=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=e.SHORT;else if(l instanceof Uint32Array)f=e.UNSIGNED_INT;else if(l instanceof Int32Array)f=e.INT;else if(l instanceof Int8Array)f=e.BYTE;else if(l instanceof Uint8Array)f=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,c,l){let h=c.array,u=c.updateRanges;if(e.bindBuffer(l,a),u.length===0)e.bufferSubData(l,0,h);else{u.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<u.length;f++){let p=u[d],_=u[f];_.start<=p.start+p.count+1?p.count=Math.max(p.count,_.start+_.count-p.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,p=u.length;f<p;f++){let _=u[f];e.bufferSubData(l,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=t.get(a);c&&(e.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,n(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var a1=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,c1=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,l1=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,h1=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,u1=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,f1=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,d1=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,p1=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,m1=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,g1=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,_1=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,y1=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,v1=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,b1=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,x1=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,M1=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,S1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,w1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,E1=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,T1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,A1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,C1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,R1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,P1=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,I1=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,L1=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,D1=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,N1=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,O1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,F1="gl_FragColor = linearToOutputTexel( gl_FragColor );",U1=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,k1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,B1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,z1=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,G1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,V1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,H1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,W1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,$1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,j1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,q1=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,X1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Y1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Z1=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,K1=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,J1=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Q1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,tM=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,eM=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,nM=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,iM=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,rM=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,sM=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,oM=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,aM=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,cM=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,lM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,hM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,uM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,dM=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,pM=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,mM=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,gM=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_M=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,yM=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,vM=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,bM=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,xM=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,MM=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,SM=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wM=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,EM=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,TM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,AM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,CM=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,RM=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,PM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,IM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,LM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,DM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,NM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,OM=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,FM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,UM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,kM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,BM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,GM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,VM=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,HM=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,WM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,$M=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,jM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qM=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,XM=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,YM=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ZM=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,KM=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,JM=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,QM=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,tS=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,eS=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,nS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,iS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,sS=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,oS=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,aS=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lS=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,uS=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fS=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,dS=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,pS=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,mS=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,gS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_S=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yS=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,vS=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,bS=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,xS=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,MS=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,SS=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wS=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ES=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,TS=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,AS=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,CS=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,RS=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,PS=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,IS=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,LS=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,DS=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,NS=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,OS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,FS=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,US=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,kS=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,BS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ne={alphahash_fragment:a1,alphahash_pars_fragment:c1,alphamap_fragment:l1,alphamap_pars_fragment:h1,alphatest_fragment:u1,alphatest_pars_fragment:f1,aomap_fragment:d1,aomap_pars_fragment:p1,batching_pars_vertex:m1,batching_vertex:g1,begin_vertex:_1,beginnormal_vertex:y1,bsdfs:v1,iridescence_fragment:b1,bumpmap_pars_fragment:x1,clipping_planes_fragment:M1,clipping_planes_pars_fragment:S1,clipping_planes_pars_vertex:w1,clipping_planes_vertex:E1,color_fragment:T1,color_pars_fragment:A1,color_pars_vertex:C1,color_vertex:R1,common:P1,defaultnormal_vertex:I1,displacementmap_pars_vertex:L1,displacementmap_vertex:D1,emissivemap_fragment:N1,emissivemap_pars_fragment:O1,colorspace_fragment:F1,colorspace_pars_fragment:U1,envmap_fragment:k1,envmap_common_pars_fragment:B1,envmap_pars_fragment:z1,envmap_pars_vertex:G1,envmap_physical_pars_fragment:J1,envmap_vertex:V1,fog_vertex:H1,fog_pars_vertex:W1,fog_fragment:$1,fog_pars_fragment:j1,gradientmap_pars_fragment:q1,lightmap_pars_fragment:X1,lights_lambert_fragment:Y1,lights_lambert_pars_fragment:Z1,lights_pars_begin:K1,lights_toon_fragment:Q1,lights_toon_pars_fragment:tM,lights_phong_fragment:eM,lights_phong_pars_fragment:nM,lights_physical_fragment:iM,lights_physical_pars_fragment:rM,lights_fragment_begin:sM,lights_fragment_maps:oM,lights_fragment_end:aM,lightprobes_pars_fragment:cM,logdepthbuf_fragment:lM,logdepthbuf_pars_fragment:hM,logdepthbuf_pars_vertex:uM,logdepthbuf_vertex:fM,map_fragment:dM,map_pars_fragment:pM,map_particle_fragment:mM,map_particle_pars_fragment:gM,metalnessmap_fragment:_M,metalnessmap_pars_fragment:yM,morphinstance_vertex:vM,morphcolor_vertex:bM,morphnormal_vertex:xM,morphtarget_pars_vertex:MM,morphtarget_vertex:SM,normal_fragment_begin:wM,normal_fragment_maps:EM,normal_pars_fragment:TM,normal_pars_vertex:AM,normal_vertex:CM,normalmap_pars_fragment:RM,clearcoat_normal_fragment_begin:PM,clearcoat_normal_fragment_maps:IM,clearcoat_pars_fragment:LM,iridescence_pars_fragment:DM,opaque_fragment:NM,packing:OM,premultiplied_alpha_fragment:FM,project_vertex:UM,dithering_fragment:kM,dithering_pars_fragment:BM,roughnessmap_fragment:zM,roughnessmap_pars_fragment:GM,shadowmap_pars_fragment:VM,shadowmap_pars_vertex:HM,shadowmap_vertex:WM,shadowmask_pars_fragment:$M,skinbase_vertex:jM,skinning_pars_vertex:qM,skinning_vertex:XM,skinnormal_vertex:YM,specularmap_fragment:ZM,specularmap_pars_fragment:KM,tonemapping_fragment:JM,tonemapping_pars_fragment:QM,transmission_fragment:tS,transmission_pars_fragment:eS,uv_pars_fragment:nS,uv_pars_vertex:iS,uv_vertex:rS,worldpos_vertex:sS,background_vert:oS,background_frag:aS,backgroundCube_vert:cS,backgroundCube_frag:lS,cube_vert:hS,cube_frag:uS,depth_vert:fS,depth_frag:dS,distance_vert:pS,distance_frag:mS,equirect_vert:gS,equirect_frag:_S,linedashed_vert:yS,linedashed_frag:vS,meshbasic_vert:bS,meshbasic_frag:xS,meshlambert_vert:MS,meshlambert_frag:SS,meshmatcap_vert:wS,meshmatcap_frag:ES,meshnormal_vert:TS,meshnormal_frag:AS,meshphong_vert:CS,meshphong_frag:RS,meshphysical_vert:PS,meshphysical_frag:IS,meshtoon_vert:LS,meshtoon_frag:DS,points_vert:NS,points_frag:OS,shadow_vert:FS,shadow_frag:US,sprite_vert:kS,sprite_frag:BS},Ct={common:{diffuse:{value:new Wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Yt}},envmap:{envMap:{value:null},envMapRotation:{value:new Yt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Yt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Yt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Yt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Yt},normalScale:{value:new ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Yt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Yt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Yt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Yt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0},uvTransform:{value:new Yt}},sprite:{diffuse:{value:new Wt(16777215)},opacity:{value:1},center:{value:new ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}}},Ni={basic:{uniforms:pn([Ct.common,Ct.specularmap,Ct.envmap,Ct.aomap,Ct.lightmap,Ct.fog]),vertexShader:ne.meshbasic_vert,fragmentShader:ne.meshbasic_frag},lambert:{uniforms:pn([Ct.common,Ct.specularmap,Ct.envmap,Ct.aomap,Ct.lightmap,Ct.emissivemap,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,Ct.fog,Ct.lights,{emissive:{value:new Wt(0)},envMapIntensity:{value:1}}]),vertexShader:ne.meshlambert_vert,fragmentShader:ne.meshlambert_frag},phong:{uniforms:pn([Ct.common,Ct.specularmap,Ct.envmap,Ct.aomap,Ct.lightmap,Ct.emissivemap,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,Ct.fog,Ct.lights,{emissive:{value:new Wt(0)},specular:{value:new Wt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ne.meshphong_vert,fragmentShader:ne.meshphong_frag},standard:{uniforms:pn([Ct.common,Ct.envmap,Ct.aomap,Ct.lightmap,Ct.emissivemap,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,Ct.roughnessmap,Ct.metalnessmap,Ct.fog,Ct.lights,{emissive:{value:new Wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ne.meshphysical_vert,fragmentShader:ne.meshphysical_frag},toon:{uniforms:pn([Ct.common,Ct.aomap,Ct.lightmap,Ct.emissivemap,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,Ct.gradientmap,Ct.fog,Ct.lights,{emissive:{value:new Wt(0)}}]),vertexShader:ne.meshtoon_vert,fragmentShader:ne.meshtoon_frag},matcap:{uniforms:pn([Ct.common,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,Ct.fog,{matcap:{value:null}}]),vertexShader:ne.meshmatcap_vert,fragmentShader:ne.meshmatcap_frag},points:{uniforms:pn([Ct.points,Ct.fog]),vertexShader:ne.points_vert,fragmentShader:ne.points_frag},dashed:{uniforms:pn([Ct.common,Ct.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ne.linedashed_vert,fragmentShader:ne.linedashed_frag},depth:{uniforms:pn([Ct.common,Ct.displacementmap]),vertexShader:ne.depth_vert,fragmentShader:ne.depth_frag},normal:{uniforms:pn([Ct.common,Ct.bumpmap,Ct.normalmap,Ct.displacementmap,{opacity:{value:1}}]),vertexShader:ne.meshnormal_vert,fragmentShader:ne.meshnormal_frag},sprite:{uniforms:pn([Ct.sprite,Ct.fog]),vertexShader:ne.sprite_vert,fragmentShader:ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Yt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ne.background_vert,fragmentShader:ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Yt}},vertexShader:ne.backgroundCube_vert,fragmentShader:ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ne.cube_vert,fragmentShader:ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ne.equirect_vert,fragmentShader:ne.equirect_frag},distance:{uniforms:pn([Ct.common,Ct.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ne.distance_vert,fragmentShader:ne.distance_frag},shadow:{uniforms:pn([Ct.lights,Ct.fog,{color:{value:new Wt(0)},opacity:{value:1}}]),vertexShader:ne.shadow_vert,fragmentShader:ne.shadow_frag}};Ni.physical={uniforms:pn([Ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Yt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Yt},clearcoatNormalScale:{value:new ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Yt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Yt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Yt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Yt},sheen:{value:0},sheenColor:{value:new Wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Yt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Yt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Yt},transmissionSamplerSize:{value:new ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Yt},attenuationDistance:{value:0},attenuationColor:{value:new Wt(0)},specularColor:{value:new Wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Yt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Yt},anisotropyVector:{value:new ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Yt}}]),vertexShader:ne.meshphysical_vert,fragmentShader:ne.meshphysical_frag};var Sh={r:0,b:0,g:0},zS=new Vt,o0=new Yt;o0.set(-1,0,0,0,1,0,0,0,1);function GS(e,t,n,i,r,s){let o=new Wt(0),a=r===!0?0:1,c,l,h=null,u=0,d=null;function f(y){let x=y.isScene===!0?y.background:null;if(x&&x.isTexture){let b=y.backgroundBlurriness>0;x=t.get(x,b)}return x}function p(y){let x=!1,b=f(y);b===null?g(o,a):b&&b.isColor&&(g(b,1),x=!0);let S=e.xr.getEnvironmentBlendMode();S==="additive"?n.buffers.color.setClear(0,0,0,1,s):S==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,s),(e.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function _(y,x){let b=f(x);b&&b.isCubeTexture?(l===void 0&&(l=new Ge(new no(1,1,1),new Wn({name:"BackgroundCubeMaterial",uniforms:hs(Ni.backgroundCube.uniforms),vertexShader:Ni.backgroundCube.vertexShader,fragmentShader:Ni.backgroundCube.fragmentShader,side:rn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(S,w,v){this.matrixWorld.copyPosition(v.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=b,l.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(zS.makeRotationFromEuler(x.backgroundRotation)).transpose(),b.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(o0),l.material.toneMapped=se.getTransfer(b.colorSpace)!==_e,(h!==b||u!==b.version||d!==e.toneMapping)&&(l.material.needsUpdate=!0,h=b,u=b.version,d=e.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new Ge(new fa(2,2),new Wn({name:"BackgroundMaterial",uniforms:hs(Ni.background.uniforms),vertexShader:Ni.background.vertexShader,fragmentShader:Ni.background.fragmentShader,side:Ir,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=se.getTransfer(b.colorSpace)!==_e,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(h!==b||u!==b.version||d!==e.toneMapping)&&(c.material.needsUpdate=!0,h=b,u=b.version,d=e.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function g(y,x){y.getRGB(Sh,nd(e)),n.buffers.color.setClear(Sh.r,Sh.g,Sh.b,x,s)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(y,x=1){o.set(y),a=x,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(y){a=y,g(o,a)},render:p,addToRenderList:_,dispose:m}}function VS(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},r=d(null),s=r,o=!1;function a(k,C,N,T,I){let B=!1,D=u(k,T,N,C);s!==D&&(s=D,l(s.object)),B=f(k,T,N,I),B&&p(k,T,N,I),I!==null&&t.update(I,e.ELEMENT_ARRAY_BUFFER),(B||o)&&(o=!1,b(k,C,N,T),I!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(I).buffer))}function c(){return e.createVertexArray()}function l(k){return e.bindVertexArray(k)}function h(k){return e.deleteVertexArray(k)}function u(k,C,N,T){let I=T.wireframe===!0,B=i[C.id];B===void 0&&(B={},i[C.id]=B);let D=k.isInstancedMesh===!0?k.id:0,j=B[D];j===void 0&&(j={},B[D]=j);let H=j[N.id];H===void 0&&(H={},j[N.id]=H);let Z=H[I];return Z===void 0&&(Z=d(c()),H[I]=Z),Z}function d(k){let C=[],N=[],T=[];for(let I=0;I<n;I++)C[I]=0,N[I]=0,T[I]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:N,attributeDivisors:T,object:k,attributes:{},index:null}}function f(k,C,N,T){let I=s.attributes,B=C.attributes,D=0,j=N.getAttributes();for(let H in j)if(j[H].location>=0){let $=I[H],J=B[H];if(J===void 0&&(H==="instanceMatrix"&&k.instanceMatrix&&(J=k.instanceMatrix),H==="instanceColor"&&k.instanceColor&&(J=k.instanceColor)),$===void 0||$.attribute!==J||J&&$.data!==J.data)return!0;D++}return s.attributesNum!==D||s.index!==T}function p(k,C,N,T){let I={},B=C.attributes,D=0,j=N.getAttributes();for(let H in j)if(j[H].location>=0){let $=B[H];$===void 0&&(H==="instanceMatrix"&&k.instanceMatrix&&($=k.instanceMatrix),H==="instanceColor"&&k.instanceColor&&($=k.instanceColor));let J={};J.attribute=$,$&&$.data&&(J.data=$.data),I[H]=J,D++}s.attributes=I,s.attributesNum=D,s.index=T}function _(){let k=s.newAttributes;for(let C=0,N=k.length;C<N;C++)k[C]=0}function g(k){m(k,0)}function m(k,C){let N=s.newAttributes,T=s.enabledAttributes,I=s.attributeDivisors;N[k]=1,T[k]===0&&(e.enableVertexAttribArray(k),T[k]=1),I[k]!==C&&(e.vertexAttribDivisor(k,C),I[k]=C)}function y(){let k=s.newAttributes,C=s.enabledAttributes;for(let N=0,T=C.length;N<T;N++)C[N]!==k[N]&&(e.disableVertexAttribArray(N),C[N]=0)}function x(k,C,N,T,I,B,D){D===!0?e.vertexAttribIPointer(k,C,N,I,B):e.vertexAttribPointer(k,C,N,T,I,B)}function b(k,C,N,T){_();let I=T.attributes,B=N.getAttributes(),D=C.defaultAttributeValues;for(let j in B){let H=B[j];if(H.location>=0){let Z=I[j];if(Z===void 0&&(j==="instanceMatrix"&&k.instanceMatrix&&(Z=k.instanceMatrix),j==="instanceColor"&&k.instanceColor&&(Z=k.instanceColor)),Z!==void 0){let $=Z.normalized,J=Z.itemSize,lt=t.get(Z);if(lt===void 0)continue;let K=lt.buffer,ct=lt.type,at=lt.bytesPerElement,Pt=ct===e.INT||ct===e.UNSIGNED_INT||Z.gpuType===Ul;if(Z.isInterleavedBufferAttribute){let _t=Z.data,Bt=_t.isInterleavedBuffer===!0?_t.stride:_t.itemSize,Pe=Z.offset;if(_t.isInstancedInterleavedBuffer||_t.isInstancedBufferAttribute){for(let Ht=0;Ht<H.locationSize;Ht++)m(H.location+Ht,_t.meshPerAttribute);k.isInstancedMesh!==!0&&T._maxInstanceCount===void 0&&(T._maxInstanceCount=_t.meshPerAttribute*_t.count)}else for(let Ht=0;Ht<H.locationSize;Ht++)g(H.location+Ht);e.bindBuffer(e.ARRAY_BUFFER,K);for(let Ht=0;Ht<H.locationSize;Ht++)x(H.location+Ht,J/H.locationSize,ct,$,Bt*at,(Pe+J/H.locationSize*Ht)*at,Pt)}else{if(Z.isInstancedBufferAttribute){for(let _t=0;_t<H.locationSize;_t++)m(H.location+_t,Z.meshPerAttribute);k.isInstancedMesh!==!0&&T._maxInstanceCount===void 0&&(T._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let _t=0;_t<H.locationSize;_t++)g(H.location+_t);e.bindBuffer(e.ARRAY_BUFFER,K);for(let _t=0;_t<H.locationSize;_t++)x(H.location+_t,J/H.locationSize,ct,$,J*at,J/H.locationSize*_t*at,Pt)}}else if(D!==void 0){let $=D[j];if($!==void 0)switch($.length){case 2:e.vertexAttrib2fv(H.location,$);break;case 3:e.vertexAttrib3fv(H.location,$);break;case 4:e.vertexAttrib4fv(H.location,$);break;default:e.vertexAttrib1fv(H.location,$)}}}}y()}function S(){U();for(let k in i){let C=i[k];for(let N in C){let T=C[N];for(let I in T){let B=T[I];for(let D in B)h(B[D].object),delete B[D];delete T[I]}}delete i[k]}}function w(k){if(i[k.id]===void 0)return;let C=i[k.id];for(let N in C){let T=C[N];for(let I in T){let B=T[I];for(let D in B)h(B[D].object),delete B[D];delete T[I]}}delete i[k.id]}function v(k){for(let C in i){let N=i[C];for(let T in N){let I=N[T];if(I[k.id]===void 0)continue;let B=I[k.id];for(let D in B)h(B[D].object),delete B[D];delete I[k.id]}}}function M(k){for(let C in i){let N=i[C],T=k.isInstancedMesh===!0?k.id:0,I=N[T];if(I!==void 0){for(let B in I){let D=I[B];for(let j in D)h(D[j].object),delete D[j];delete I[B]}delete N[T],Object.keys(N).length===0&&delete i[C]}}}function U(){P(),o=!0,s!==r&&(s=r,l(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:U,resetDefaultState:P,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfObject:M,releaseStatesOfProgram:v,initAttributes:_,enableAttribute:g,disableUnusedAttributes:y}}function HS(e,t,n){let i;function r(c){i=c}function s(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,h){h!==0&&(e.drawArraysInstanced(i,c,l,h),n.update(l,i,h))}function a(c,l,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,h);let d=0;for(let f=0;f<h;f++)d+=l[f];n.update(d,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function WS(e,t,n,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){let v=t.get("EXT_texture_filter_anisotropic");r=e.getParameter(v.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(v){return!(v!==gi&&i.convert(v)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(v){let M=v===qn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(v!==Ln&&v!==ii&&!M&&i.convert(v)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(v){if(v==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";v="mediump"}return v==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=n.precision!==void 0?n.precision:"highp",h=c(l);h!==l&&(Gt("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),d=n.logarithmicDepthBuffer===!0&&u===!1;n.reversedDepthBuffer===!0&&u===!1&&Gt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),n.logarithmicDepthBuffer===!0&&u===!0&&Gt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let f=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),p=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),y=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),x=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),S=e.getParameter(e.MAX_SAMPLES),w=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:p,maxTextureSize:_,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:y,maxVaryings:x,maxFragmentUniforms:b,maxSamples:S,samples:w}}function $S(e){let t=this,n=null,i=0,r=!1,s=!1,o=new xn,a=new Yt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||i!==0||r;return r=d,i=u.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){n=h(u,d,0)},this.setState=function(u,d,f){let p=u.clippingPlanes,_=u.clipIntersection,g=u.clipShadows,m=e.get(u);if(!r||p===null||p.length===0||s&&!g)s?h(null):l();else{let y=s?0:i,x=y*4,b=m.clippingState||null;c.value=b,b=h(p,d,x,f);for(let S=0;S!==x;++S)b[S]=n[S];m.clippingState=b,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=y}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(u,d,f,p){let _=u!==null?u.length:0,g=null;if(_!==0){if(g=c.value,p!==!0||g===null){let m=f+_*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(g===null||g.length<m)&&(g=new Float32Array(m));for(let x=0,b=f;x!==_;++x,b+=4)o.copy(u[x]).applyMatrix4(y,a),o.normal.toArray(g,b),g[b+3]=o.constant}c.value=g,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,g}}var Ia=class extends wn{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];this.texture=new aa(r),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new no(5,5,5),s=new Wn({name:"CubemapFromEquirect",uniforms:hs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:rn,blending:nr});s.uniforms.tEquirect.value=n;let o=new Ge(r,s),a=n.minFilter;return n.minFilter===ir&&(n.minFilter=Sn),new oo(1,10,this).update(t,o),n.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,n=!0,i=!0,r=!0){let s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(n,i,r);t.setRenderTarget(s)}},kg=256,jS=3,qS=20,a0=256,c0=16,XS=3,YS=new O,ZS=new Wt,Eh=class e{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new oo(1,10,null),this._boxMesh=new Ge(new no(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,n=0,i=.1,r=100,s={}){let{size:o=256,position:a=YS}=s,c=this._renderer;this._setSize(o);let l=this._allocateTarget(),h=this._getSourceTarget(!0);n>0&&(h.texture.mipmapsAutoUpdate=!1);let u=c.autoClear,d=c.autoClearColor,f=c.autoClearDepth,p=c.autoClearStencil,_=t.background;c.autoClear=!0,c.autoClearColor=!0,c.autoClearDepth=!0,c.autoClearStencil=!0,_===null&&(t.background=c.getClearColor(ZS));let g=new oo(i,r,h);return g.position.copy(a),g.update(c,t),c.autoClear=u,c.autoClearColor=d,c.autoClearDepth=f,c.autoClearStencil=p,t.background=_,n>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(l,n)),this._applyPMREM(l),l}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Gg(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=zg(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,n){return n>0?1-Math.sqrt(1-t/n):0}_setSize(t){this._cubeSize=Math.max(kg,Jf(t))}_fromTexture(t,n){t.mapping===cs||t.mapping===ho?this._setSize(t.image.length===0?kg:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let i=n||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(i),i}_allocateTarget(){let t=this._cubeSize,n=Bg(t,!1,!1),i=Math.log2(t)-jS;for(let r=0;r<=i;r++)n.texture.mipmaps.push({width:t>>r,height:t>>r});return n.texture.name="PMREM",n.texture.isPMREMTexture=!0,n}_getSourceTarget(t=!1){let n=this._cubeSize,i=this._sourceTarget;return(i===null||i.width!==n||t&&i.depthBuffer===!1)&&(i!==null&&i.dispose(),this._sourceTarget=Bg(n,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,n,i){let r=this._boxMesh,s=this._cubeCamera;r.material=i,s.renderTarget=t,s.activeMipmapLevel=n;let o=t.width>>n;t.viewport.set(0,0,o,o),s.update(this._renderer,r),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let n;t.mapping===cs||t.mapping===ho?(this._cubemapMaterial===null&&(this._cubemapMaterial=Gg()),n=this._cubemapMaterial,n.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=zg()),n=this._equirectMaterial),n.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,n)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=KS(),this._integrationMaterial=JS());let n=this._cubeSize,i=t.texture.mipmaps.length-1,r=this._ggxMaterial.uniforms;r.envMap.value=this._sourceTarget.texture;let s=this._integrationMaterial.uniforms;s.envMap.value=this._sourceTarget.texture,s.sourceLod.value=Math.log2(n/c0);for(let o=0;o<=i;o++){let a=e.lodToRoughness(o,i);if(o>i-XS)s.roughness.value=a,this._renderCube(t,o,this._integrationMaterial);else{let c=a>0?Math.log2(n)+.5*Math.log2(6/(a0*Math.pow(a,4)))+.5:0;r.roughness.value=a,r.lodBias.value=c,this._renderCube(t,o,this._ggxMaterial)}}}_blur(t,n){this._blurMaterial===null&&(this._blurMaterial=QS());let i=this._blurMaterial,r=i.uniforms,s=this._sourceTarget;r.sigma.value=Math.min(n,Math.PI)/Math.SQRT2,r.envMap.value=s.texture,this._renderCube(t,0,i),r.envMap.value=t.texture,this._renderCube(s,0,i)}};function Bg(e,t,n){return new Ia(e,{minFilter:ir,generateMipmaps:t,type:qn,colorSpace:Zo,depthBuffer:n})}function La(e,t,n){return new Wn({name:e,uniforms:t,vertexShader:ne.cube_vert,fragmentShader:n,side:rn,blending:nr,depthTest:!1,depthWrite:!1})}function KS(){return La("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${a0}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function JS(){return La("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:c0}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function QS(){return La("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${qS}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function zg(){return La("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Gg(){return La("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function tw(e){let t=new WeakMap,n=new WeakMap,i=null;function r(d,f=!1){return d==null?null:f?o(d):s(d)}function s(d){if(d&&d.isTexture){let f=d.mapping;if(f===Nl||f===Ol)if(t.has(d)){let p=t.get(d).texture;return a(p,d.mapping)}else{let p=d.image;if(p&&p.height>0){let _=new Ia(p.height);return _.fromEquirectangularTexture(e,d),t.set(d,_),d.addEventListener("dispose",l),a(_.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture&&d.isPMREMTexture!==!0){let f=d.mapping,p=f===Nl||f===Ol,_=f===cs||f===ho;if(p||_){let g=n.get(d),m=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return i===null&&(i=new Eh(e)),g=p?i.fromEquirectangular(d,g):i.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,n.set(d,g),g.texture;if(g!==void 0)return g.texture;{let y=d.image;return p&&y&&y.height>0||_&&y&&c(y)?(i===null&&(i=new Eh(e)),g=p?i.fromEquirectangular(d):i.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,n.set(d,g),d.addEventListener("dispose",h),g.texture):null}}}return d}function a(d,f){return f===Nl?d.mapping=cs:f===Ol&&(d.mapping=ho),d}function c(d){let f=0,p=6;for(let _=0;_<p;_++)d[_]!==void 0&&f++;return f===p}function l(d){let f=d.target;f.removeEventListener("dispose",l);let p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function h(d){let f=d.target;f.removeEventListener("dispose",h);let p=n.get(f);p!==void 0&&(n.delete(f),p.dispose())}function u(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:u}}function ew(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let r=e.getExtension(i);return t[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let r=n(i);return r===null&&Wo("WebGLRenderer: "+i+" extension not supported."),r}}}function nw(e,t,n,i){let r={},s=new WeakMap,o=new FinalizationRegistry(p=>delete r[p]);function a(p){c(p.target)}function c(p){p.index!==null&&t.remove(p.index);for(let g in p.attributes)t.remove(p.attributes[g]);p.removeEventListener("dispose",a),delete r[p.id],o.unregister(p);let _=s.get(p);_&&(t.remove(_),s.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,n.memory.geometries--}function l(p,_){return r[_.id]!==void 0||(_.addEventListener("dispose",a),r[_.id]=new WeakRef(_),o.register(_,_.id,_),n.memory.geometries++),_}function h(p){let _=p.attributes;for(let g in _)t.update(_[g],e.ARRAY_BUFFER)}function u(p){let _=p.index,g=p.attributes.position,m=0;if(g===void 0)return;let y=_!==null?_.array.length:g.array.length/3-1,x=g.count>=65535?ia:na,b=new x(Math.ceil(y/3)*6,1),S=b.array;if(_!==null){let v=_.array;m=_.version;for(let M=0,U=0;M<y;M+=3){let P=v[M+0],k=v[M+1],C=v[M+2];S[U++]=P,S[U++]=k,S[U++]=k,S[U++]=C,S[U++]=C,S[U++]=P}}else{m=g.version;for(let v=0,M=0;v<y;v+=3){let U=v+0,P=v+1,k=v+2;S[M++]=U,S[M++]=P,S[M++]=P,S[M++]=k,S[M++]=k,S[M++]=U}}b.version=m;let w=s.get(p);w&&t.remove(w),s.set(p,b)}function d(p){let _=s.get(p);if(_){let g=p.index;g!==null&&_.version<g.version&&u(p)}else u(p);return s.get(p)}function f(){for(let p in r){let _=r[p].deref();_!==void 0&&c(_)}}return{get:l,update:h,getWireframeAttribute:d,dispose:f}}function iw(e,t,n){let i;function r(u){i=u}let s,o;function a(u){s=u.type,o=u.bytesPerElement}function c(u,d){e.drawElements(i,d,s,u*o),n.update(d,i,1)}function l(u,d,f){f!==0&&(e.drawElementsInstanced(i,d,s,u*o,f),n.update(d,i,f))}function h(u,d,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,d,0,s,u,0,f);let _=0;for(let g=0;g<f;g++)_+=d[g];n.update(_,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function rw(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=a*(s/3);break;case e.LINES:n.lines+=a*(s/2);break;case e.LINE_STRIP:n.lines+=a*(s-1);break;case e.LINE_LOOP:n.lines+=a*s;break;case e.POINTS:n.points+=a*s;break;default:qt("WebGLInfo: Unknown draw mode:",o);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:r,update:i}}function sw(e,t,n){let i=new WeakMap,r=new Ie;function s(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=i.get(a);if(d===void 0||d.count!==u){let U=function(){v.dispose(),i.delete(a),a.removeEventListener("dispose",U)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],y=a.morphAttributes.color||[],x=0;f===!0&&(x=1),p===!0&&(x=2),_===!0&&(x=3);let b=a.attributes.position.count*x,S=1;b>t.maxTextureSize&&(S=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);let w=new Float32Array(b*S*4*u),v=new Qo(w,b,S,u);v.type=ii,v.needsUpdate=!0;let M=x*4;for(let P=0;P<u;P++){let k=g[P],C=m[P],N=y[P],T=b*S*4*P;for(let I=0;I<k.count;I++){let B=I*M;f===!0&&(r.fromBufferAttribute(k,I),w[T+B+0]=r.x,w[T+B+1]=r.y,w[T+B+2]=r.z,w[T+B+3]=0),p===!0&&(r.fromBufferAttribute(C,I),w[T+B+4]=r.x,w[T+B+5]=r.y,w[T+B+6]=r.z,w[T+B+7]=0),_===!0&&(r.fromBufferAttribute(N,I),w[T+B+8]=r.x,w[T+B+9]=r.y,w[T+B+10]=r.z,w[T+B+11]=N.itemSize===4?r.w:1)}}d={count:u,texture:v,size:new ut(b,S)},i.set(a,d),a.addEventListener("dispose",U)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let f=0;for(let _=0;_<l.length;_++)f+=l[_];let p=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(e,"morphTargetBaseInfluence",p),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",d.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",d.size)}return{update:s}}function ow(e,t,n,i,r){let s=new WeakMap;function o(l){let h=r.render.frame,u=l.geometry,d=t.get(l,u);if(s.get(d)!==h&&(t.update(d),s.set(d,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==h&&(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,e.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==h&&(f.update(),s.set(f,h))}return d}function a(){s=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),i.releaseStatesOfObject(h),n.remove(h.instanceMatrix),h.instanceColor!==null&&n.remove(h.instanceColor)}return{update:o,dispose:a}}var aw={[Lf]:"LINEAR_TONE_MAPPING",[Df]:"REINHARD_TONE_MAPPING",[Nf]:"CINEON_TONE_MAPPING",[Of]:"ACES_FILMIC_TONE_MAPPING",[Uf]:"AGX_TONE_MAPPING",[kf]:"NEUTRAL_TONE_MAPPING",[Ff]:"CUSTOM_TONE_MAPPING"};function cw(e,t,n,i,r,s){let o=new wn(t,n,{type:e,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=null,h=new Ae;h.setAttribute("position",new de([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new de([0,2,0,0,2,0],2));let u=new _l({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Ge(h,u),f=new ss(-1,1,1,-1,0,1),p=null,_=null,g=!1,m,y=null,x=[],b=!1;this.setSize=function(S,w){o.setSize(S,w),a!==null&&a.setSize(S,w),c!==null&&c.setSize(S,w);for(let v=0;v<x.length;v++){let M=x[v];M.setSize&&M.setSize(S,w)}},this.setEffects=function(S){x=S,b=x.length>0&&x[0].isRenderPass===!0;let w=o.width,v=o.height;x.length>0&&a===null&&(a=new wn(w,v,{type:qn,depthBuffer:!1,stencilBuffer:!1}),c=new wn(w,v,{type:qn,depthBuffer:!1,stencilBuffer:!1}));let M=r===!0&&x.some(U=>U.needsDepthTexture===!0);M!==(o.depthTexture!==null)&&(M===!0&&l===null&&(l=new tr(w,v),s===!0&&(l.format=rr,l.type=ls)),o.dispose(),o.depthTexture=M?l:null,o.resolveDepthBuffer=M,o.storeMultisampledDepthBuffer=M);for(let U=0;U<x.length;U++){let P=x[U];P.setSize&&P.setSize(w,v),M&&P.needsDepthTexture===!0&&P.setDepthTexture&&P.setDepthTexture(l)}},this.begin=function(S,w){if(g||S.toneMapping===Li&&x.length===0)return!1;if(y=w,w!==null){let v=w.width,M=w.height;(o.width!==v||o.height!==M)&&this.setSize(v,M)}return b===!1&&S.setRenderTarget(o),m=S.toneMapping,S.toneMapping=Li,!0},this.hasRenderPass=function(){return b},this.end=function(S,w){S.toneMapping=m,g=!0;let v=o,M=a;for(let U=0;U<x.length;U++){let P=x[U];P.enabled!==!1&&(P.render(S,M,v,w),P.needsSwap!==!1&&(v=M,M=M===a?c:a))}if(p!==S.outputColorSpace||_!==S.toneMapping){p=S.outputColorSpace,_=S.toneMapping,u.defines={},se.getTransfer(p)===_e&&(u.defines.SRGB_TRANSFER="");let U=aw[_];U&&(u.defines[U]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=v.texture,S.setRenderTarget(y),S.render(d,f),y=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),h.dispose(),u.dispose()}}var l0=new fn,h0=new tr(1,1),u0=new ca(1),f0=new Qo,d0=new rl,p0=new aa,Vg=[],Hg=[],Wg=new Float32Array(16),$g=new Float32Array(9),jg=new Float32Array(4);function po(e,t,n){let i=e[0];if(i<=0||i>0)return e;let r=t*n,s=Vg[r];if(s===void 0&&(s=new Float32Array(r),Vg[r]=s),t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=n,e[o].toArray(s,a)}return s}function $e(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function je(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Ah(e,t){let n=Hg[t];n===void 0&&(n=new Int32Array(t),Hg[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function lw(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function hw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if($e(n,t))return;e.uniform2fv(this.addr,t),je(n,t)}}function uw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if($e(n,t))return;e.uniform3fv(this.addr,t),je(n,t)}}function fw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if($e(n,t))return;e.uniform4fv(this.addr,t),je(n,t)}}function dw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if($e(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),je(n,t)}else{if($e(n,i))return;jg.set(i),e.uniformMatrix2fv(this.addr,!1,jg),je(n,i)}}function pw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if($e(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),je(n,t)}else{if($e(n,i))return;$g.set(i),e.uniformMatrix3fv(this.addr,!1,$g),je(n,i)}}function mw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if($e(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),je(n,t)}else{if($e(n,i))return;Wg.set(i),e.uniformMatrix4fv(this.addr,!1,Wg),je(n,i)}}function gw(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function _w(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if($e(n,t))return;e.uniform2iv(this.addr,t),je(n,t)}}function yw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if($e(n,t))return;e.uniform3iv(this.addr,t),je(n,t)}}function vw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if($e(n,t))return;e.uniform4iv(this.addr,t),je(n,t)}}function bw(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function xw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if($e(n,t))return;e.uniform2uiv(this.addr,t),je(n,t)}}function Mw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if($e(n,t))return;e.uniform3uiv(this.addr,t),je(n,t)}}function Sw(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if($e(n,t))return;e.uniform4uiv(this.addr,t),je(n,t)}}function Ch(e){return e.version===0&&(e.compareFunction=Xf,e.needsUpdate=!0),e}function ww(e,t,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r);let s;this.type===e.SAMPLER_2D_SHADOW?s=Ch(h0):s=l0,n.setTexture2D(t||s,r)}function Ew(e,t,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r),n.setTexture3D(t||d0,r)}function Tw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r);let s;this.type===e.SAMPLER_CUBE_SHADOW?s=Ch(u0):s=p0,n.setTextureCube(t||s,r)}function Aw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r),n.setTexture2DArray(t||f0,r)}function Cw(e){switch(e){case 5126:return lw;case 35664:return hw;case 35665:return uw;case 35666:return fw;case 35674:return dw;case 35675:return pw;case 35676:return mw;case 5124:case 35670:return gw;case 35667:case 35671:return _w;case 35668:case 35672:return yw;case 35669:case 35673:return vw;case 5125:return bw;case 36294:return xw;case 36295:return Mw;case 36296:return Sw;case 35678:case 36198:case 36298:case 36306:case 35682:return ww;case 35679:case 36299:case 36307:return Ew;case 35680:case 36300:case 36308:case 36293:return Tw;case 36289:case 36303:case 36311:case 36292:return Aw}}function Rw(e,t){e.uniform1fv(this.addr,t)}function Pw(e,t){let n=po(t,this.size,2);e.uniform2fv(this.addr,n)}function Iw(e,t){let n=po(t,this.size,3);e.uniform3fv(this.addr,n)}function Lw(e,t){let n=po(t,this.size,4);e.uniform4fv(this.addr,n)}function Dw(e,t){let n=po(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Nw(e,t){let n=po(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ow(e,t){let n=po(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Fw(e,t){e.uniform1iv(this.addr,t)}function Uw(e,t){e.uniform2iv(this.addr,t)}function kw(e,t){e.uniform3iv(this.addr,t)}function Bw(e,t){e.uniform4iv(this.addr,t)}function zw(e,t){e.uniform1uiv(this.addr,t)}function Gw(e,t){e.uniform2uiv(this.addr,t)}function Vw(e,t){e.uniform3uiv(this.addr,t)}function Hw(e,t){e.uniform4uiv(this.addr,t)}function Ww(e,t,n){let i=this.cache,r=t.length,s=Ah(n,r);$e(i,s)||(e.uniform1iv(this.addr,s),je(i,s));let o;this.type===e.SAMPLER_2D_SHADOW?o=Ch(h0):o=l0;for(let a=0;a!==r;++a)n.setTexture2D(t[a]||o,s[a])}function $w(e,t,n){let i=this.cache,r=t.length,s=Ah(n,r);$e(i,s)||(e.uniform1iv(this.addr,s),je(i,s));for(let o=0;o!==r;++o)n.setTexture3D(t[o]||d0,s[o])}function jw(e,t,n){let i=this.cache,r=t.length,s=Ah(n,r);$e(i,s)||(e.uniform1iv(this.addr,s),je(i,s));let o;this.type===e.SAMPLER_CUBE_SHADOW?o=Ch(u0):o=p0;for(let a=0;a!==r;++a)n.setTextureCube(t[a]||o,s[a])}function qw(e,t,n){let i=this.cache,r=t.length,s=Ah(n,r);$e(i,s)||(e.uniform1iv(this.addr,s),je(i,s));for(let o=0;o!==r;++o)n.setTexture2DArray(t[o]||f0,s[o])}function Xw(e){switch(e){case 5126:return Rw;case 35664:return Pw;case 35665:return Iw;case 35666:return Lw;case 35674:return Dw;case 35675:return Nw;case 35676:return Ow;case 5124:case 35670:return Fw;case 35667:case 35671:return Uw;case 35668:case 35672:return kw;case 35669:case 35673:return Bw;case 5125:return zw;case 36294:return Gw;case 36295:return Vw;case 36296:return Hw;case 35678:case 36198:case 36298:case 36306:case 35682:return Ww;case 35679:case 36299:case 36307:return $w;case 35680:case 36300:case 36308:case 36293:return jw;case 36289:case 36303:case 36311:case 36292:return qw}}var dd=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=Cw(n.type)}},pd=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=Xw(n.type)}},md=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){let r=this.seq;for(let s=0,o=r.length;s!==o;++s){let a=r[s];a.setValue(t,n[a.id],i)}}},ud=/(\w+)(\])?(\[|\.)?/g;function qg(e,t){e.seq.push(t),e.map[t.id]=t}function Yw(e,t,n){let i=e.name,r=i.length;for(ud.lastIndex=0;;){let s=ud.exec(i),o=ud.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){qg(n,l===void 0?new dd(a,e,t):new pd(a,e,t));break}else{let u=n.map[a];u===void 0&&(u=new md(a),qg(n,u)),n=u}}}var fo=class{constructor(t,n){this.seq=[],this.map={};let i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=t.getActiveUniform(n,o),c=t.getUniformLocation(n,a.name);Yw(a,c,this)}let r=[],s=[];for(let o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?r.push(o):s.push(o);r.length>0&&(this.seq=r.concat(s))}setValue(t,n,i,r){let s=this.map[n];s!==void 0&&s.setValue(t,i,r)}setOptional(t,n,i){let r=n[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,n,i,r){for(let s=0,o=n.length;s!==o;++s){let a=n[s],c=i[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,r)}}static seqWithValue(t,n){let i=[];for(let r=0,s=t.length;r!==s;++r){let o=t[r];o.id in n&&i.push(o)}return i}};function Xg(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var Zw=37297,Kw=0;function Jw(e,t){let n=e.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,n.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${n[o]}`)}return i.join(`
`)}var Yg=new Yt;function Qw(e){se._getMatrix(Yg,se.workingColorSpace,e);let t=`mat3( ${Yg.elements.map(n=>n.toFixed(4))} )`;switch(se.getTransfer(e)){case Ko:return[t,"LinearTransferOETF"];case _e:return[t,"sRGBTransferOETF"];default:return Gt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function Zg(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),s=(e.getShaderInfoLog(t)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return n.toUpperCase()+`

`+s+`

`+Jw(e.getShaderSource(t),a)}else return s}function tE(e,t){let n=Qw(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var eE={[Lf]:"Linear",[Df]:"Reinhard",[Nf]:"Cineon",[Of]:"ACESFilmic",[Uf]:"AgX",[kf]:"Neutral",[Ff]:"Custom"};function nE(e,t){let n=eE[t];return n===void 0?(Gt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var wh=new O;function iE(){se.getLuminanceCoefficients(wh);let e=wh.x.toFixed(4),t=wh.y.toFixed(4),n=wh.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function rE(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Pa).join(`
`)}function sE(e){let t=[];for(let n in e){let i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function oE(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=e.getActiveAttrib(t,r),o=s.name,a=1;s.type===e.FLOAT_MAT2&&(a=2),s.type===e.FLOAT_MAT3&&(a=3),s.type===e.FLOAT_MAT4&&(a=4),n[o]={type:s.type,location:e.getAttribLocation(t,o),locationSize:a}}return n}function Pa(e){return e!==""}function Kg(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Jg(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var aE=/^[ \t]*#include +<([\w\d./]+)>/gm;function gd(e){return e.replace(aE,cE)}function cE(e,t){let n=ne[t];if(n===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return gd(n)}var lE=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Qg(e){return e.replace(lE,hE)}function hE(e,t,n,i){let r="";for(let s=parseInt(t);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function t0(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var uE={[xa]:"SHADOWMAP_TYPE_PCF",[co]:"SHADOWMAP_TYPE_VSM"};function fE(e){return uE[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var dE={[ho]:"ENVMAP_MODE_REFRACTION"};function pE(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":dE[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var mE={[Dl]:"ENVMAP_BLENDING_MULTIPLY",[vg]:"ENVMAP_BLENDING_MIX",[bg]:"ENVMAP_BLENDING_ADD"};function gE(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":mE[e.combine]||"ENVMAP_BLENDING_NONE"}function _E(e,t,n,i){let r=e.getContext(),s=n.defines,o=n.vertexShader,a=n.fragmentShader,c=fE(n),l=n.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=pE(n),u=gE(n),d=rE(n),f=sE(s),p=r.createProgram(),_,g,m=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(_=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,f].filter(Pa).join(`
`),_.length>0&&(_+=`
`),g=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,f].filter(Pa).join(`
`),g.length>0&&(g+=`
`)):(_=[t0(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,f,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+n.diffuseRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Pa).join(`
`),g=[t0(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,f,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+h:"",n.envMap?"#define "+u:"",n.envMapPMREM?"#define ENVMAP_MAX_LOD "+n.envMapMaxLod+".0":"",n.envMapPMREM?"#define ENVMAP_SIZE "+n.envMapSize+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",n.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Li?"#define TONE_MAPPING":"",n.toneMapping!==Li?ne.tonemapping_pars_fragment:"",n.toneMapping!==Li?nE("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",ne.colorspace_pars_fragment,tE("linearToOutputTexel",n.outputColorSpace),iE(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Pa).join(`
`)),o=gd(o),o=Kg(o,n),o=Jg(o,n),a=gd(a),a=Kg(a,n),a=Jg(a,n),o=Qg(o),a=Qg(a),n.isRawShaderMaterial!==!0&&(m=`#version 300 es
`,_=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,g=["#define varying in",n.glslVersion===Zf?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===Zf?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let y=m+_+o,x=m+g+a,b=Xg(r,r.VERTEX_SHADER,y),S=Xg(r,r.FRAGMENT_SHADER,x);r.attachShader(p,b),r.attachShader(p,S),n.index0AttributeName!==void 0?r.bindAttribLocation(p,0,n.index0AttributeName):n.hasPositionAttribute===!0&&r.bindAttribLocation(p,0,"position"),r.linkProgram(p);function w(P){if(e.debug.checkShaderErrors){let k=r.getProgramInfoLog(p)||"",C=r.getShaderInfoLog(b)||"",N=r.getShaderInfoLog(S)||"",T=k.trim(),I=C.trim(),B=N.trim(),D=!0,j=!0;if(r.getProgramParameter(p,r.LINK_STATUS)===!1)if(D=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(r,p,b,S);else{let H=Zg(r,b,"vertex"),Z=Zg(r,S,"fragment");qt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(p,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+T+`
`+H+`
`+Z)}else T!==""?Gt("WebGLProgram: Program Info Log:",T):(I===""||B==="")&&(j=!1);j&&(P.diagnostics={runnable:D,programLog:T,vertexShader:{log:I,prefix:_},fragmentShader:{log:B,prefix:g}})}r.deleteShader(b),r.deleteShader(S),v=new fo(r,p),M=oE(r,p)}let v;this.getUniforms=function(){return v===void 0&&w(this),v};let M;this.getAttributes=function(){return M===void 0&&w(this),M};let U=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=r.getProgramParameter(p,Zw)),U},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(p),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Kw++,this.cacheKey=t,this.usedTimes=1,this.program=p,this.vertexShader=b,this.fragmentShader=S,this}var yE=0,_d=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){let r=this._getShaderCacheForMaterial(t);return r.has(n)===!1&&(r.add(n),n.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(t){let n=this.materialCache.get(t);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let n=this.materialCache,i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){let n=this.shaderCache,i=n.get(t);return i===void 0&&(i=new yd(t),n.set(t,i)),i}},yd=class{constructor(t){this.id=yE++,this.code=t,this.usedTimes=0}};function vE(e){return e===Lr||e===Aa||e===Ca}function bE(e,t,n,i,r,s){let o=new Js,a=new _d,c=new Set,l=[],h=new Map,u=i.logarithmicDepthBuffer,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function f(v){return c.add(v),v===0?"uv":`uv${v}`}function p(v,M,U,P,k,C){let N=P.fog,T=k.geometry,I=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?P.environment:null,B=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,D=t.get(v.envMap||I,B),j=d[v.type],H=i.precision;v.precision!==null&&(H=i.getMaxPrecision(v.precision),H!==v.precision&&Gt("WebGLProgram.getParameters:",v.precision,"not supported, using",H,"instead."));let Z=T.morphAttributes.position||T.morphAttributes.normal||T.morphAttributes.color,$=Z!==void 0?Z.length:0,J=0;T.morphAttributes.position!==void 0&&(J=1),T.morphAttributes.normal!==void 0&&(J=2),T.morphAttributes.color!==void 0&&(J=3);let lt,K,ct,at;if(j){let At=Ni[j];lt=At.vertexShader,K=At.fragmentShader}else{lt=v.vertexShader,K=v.fragmentShader;let At=a.getVertexShaderStage(v),oe=a.getFragmentShaderStage(v);a.update(v,At,oe),ct=At.id,at=oe.id}let Pt=e.getRenderTarget(),_t=e.state.buffers.depth.getReversed(),Bt=k.isInstancedMesh===!0,Pe=k.isBatchedMesh===!0,Ht=!!v.map,he=!!v.matcap,ge=!!D,ie=ge&&D.isPMREMTexture===!0,He=!!v.aoMap,Ne=!!v.lightMap,Qe=!!v.bumpMap&&v.wireframe===!1,Te=!!v.normalMap,Un=!!v.displacementMap,Ue=!!v.emissiveMap,Xe=!!v.metalnessMap,on=!!v.roughnessMap,Rn=v.anisotropy>0,q=v.clearcoat>0,yn=v.diffuseRoughness>0,ve=v.dispersion>0,Me=v.retroreflectivity>0,Et=v.iridescence>0,Oe=v.sheen>0,Ot=v.transmission>0,Xt=Rn&&!!v.anisotropyMap,L=q&&!!v.clearcoatMap,A=q&&!!v.clearcoatNormalMap,Y=q&&!!v.clearcoatRoughnessMap,ht=yn&&!!v.diffuseRoughnessMap,st=Et&&!!v.iridescenceMap,Mt=Et&&!!v.iridescenceThicknessMap,wt=Oe&&!!v.sheenColorMap,nt=Oe&&!!v.sheenRoughnessMap,it=!!v.specularMap,xt=!!v.specularColorMap,G=!!v.specularIntensityMap,et=Ot&&!!v.transmissionMap,tt=Ot&&!!v.thicknessMap,St=!!v.gradientMap,mt=!!v.alphaMap,yt=v.alphaTest>0,It=!!v.alphaHash,$t=!!v.extensions,dt=Li;v.toneMapped&&(Pt===null||Pt.isXRRenderTarget===!0)&&(dt=e.toneMapping);let Nt=ie?D.isCompressedCubeTexture?D.image[0].mipmaps:D.mipmaps:null,Kt={shaderID:j,shaderType:v.type,shaderName:v.name,vertexShader:lt,fragmentShader:K,defines:v.defines,customVertexShaderID:ct,customFragmentShaderID:at,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:H,batching:Pe,batchingColor:Pe&&k._colorsTexture!==null,instancing:Bt,instancingColor:Bt&&k.instanceColor!==null,instancingMorph:Bt&&k.morphTexture!==null,outputColorSpace:Pt===null?e.outputColorSpace:Pt.isXRRenderTarget===!0?Pt.texture.colorSpace:se.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Ht,matcap:he,envMap:ge,envMapMode:ge&&D.mapping,envMapPMREM:ie,envMapMaxLod:ie?Nt.length-1:null,envMapSize:ie?Nt[0].width:null,aoMap:He,lightMap:Ne,bumpMap:Qe,normalMap:Te,displacementMap:Un,emissiveMap:Ue,normalMapObjectSpace:Te&&v.normalMapType===Sg,normalMapTangentSpace:Te&&v.normalMapType===bh,packedNormalMap:Te&&v.normalMapType===bh&&vE(v.normalMap.format),metalnessMap:Xe,roughnessMap:on,anisotropy:Rn,anisotropyMap:Xt,clearcoat:q,clearcoatMap:L,clearcoatNormalMap:A,clearcoatRoughnessMap:Y,diffuseRoughness:yn,diffuseRoughnessMap:ht,dispersion:ve,retroreflection:Me,iridescence:Et,iridescenceMap:st,iridescenceThicknessMap:Mt,sheen:Oe,sheenColorMap:wt,sheenRoughnessMap:nt,specularMap:it,specularColorMap:xt,specularIntensityMap:G,transmission:Ot,transmissionMap:et,thicknessMap:tt,gradientMap:St,opaque:v.transparent===!1&&v.blending===lo&&v.alphaToCoverage===!1,alphaMap:mt,alphaTest:yt,alphaHash:It,combine:v.combine,mapUv:Ht&&f(v.map.channel),aoMapUv:He&&f(v.aoMap.channel),lightMapUv:Ne&&f(v.lightMap.channel),bumpMapUv:Qe&&f(v.bumpMap.channel),normalMapUv:Te&&f(v.normalMap.channel),displacementMapUv:Un&&f(v.displacementMap.channel),emissiveMapUv:Ue&&f(v.emissiveMap.channel),metalnessMapUv:Xe&&f(v.metalnessMap.channel),roughnessMapUv:on&&f(v.roughnessMap.channel),anisotropyMapUv:Xt&&f(v.anisotropyMap.channel),clearcoatMapUv:L&&f(v.clearcoatMap.channel),clearcoatNormalMapUv:A&&f(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Y&&f(v.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ht&&f(v.diffuseRoughnessMap.channel),iridescenceMapUv:st&&f(v.iridescenceMap.channel),iridescenceThicknessMapUv:Mt&&f(v.iridescenceThicknessMap.channel),sheenColorMapUv:wt&&f(v.sheenColorMap.channel),sheenRoughnessMapUv:nt&&f(v.sheenRoughnessMap.channel),specularMapUv:it&&f(v.specularMap.channel),specularColorMapUv:xt&&f(v.specularColorMap.channel),specularIntensityMapUv:G&&f(v.specularIntensityMap.channel),transmissionMapUv:et&&f(v.transmissionMap.channel),thicknessMapUv:tt&&f(v.thicknessMap.channel),alphaMapUv:mt&&f(v.alphaMap.channel),vertexTangents:!!T.attributes.tangent&&(Te||Rn),vertexNormals:!!T.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!T.attributes.color&&T.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!T.attributes.uv&&(Ht||mt),fog:!!N,useFog:v.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||T.attributes.normal===void 0&&Te===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:_t,skinning:k.isSkinnedMesh===!0,hasPositionAttribute:T.attributes.position!==void 0,morphTargets:T.morphAttributes.position!==void 0,morphNormals:T.morphAttributes.normal!==void 0,morphColors:T.morphAttributes.color!==void 0,morphTargetsCount:$,morphTextureStride:J,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:C.filter(At=>At.texture!==null).length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:e.shadowMap.enabled&&U.length>0,shadowMapType:e.shadowMap.type,toneMapping:dt,decodeVideoTexture:Ht&&v.map.isVideoTexture===!0&&se.getTransfer(v.map.colorSpace)===_e,decodeVideoTextureEmissive:Ue&&v.emissiveMap.isVideoTexture===!0&&se.getTransfer(v.emissiveMap.colorSpace)===_e,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Ii,flipSided:v.side===rn,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:$t&&v.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($t&&v.extensions.multiDraw===!0||Pe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Kt.vertexUv1s=c.has(1),Kt.vertexUv2s=c.has(2),Kt.vertexUv3s=c.has(3),c.clear(),Kt}function _(v){let M=[];if(v.shaderID?M.push(v.shaderID):(M.push(v.customVertexShaderID),M.push(v.customFragmentShaderID)),v.defines!==void 0)for(let U in v.defines)M.push(U),M.push(v.defines[U]);return v.isRawShaderMaterial===!1&&(g(M,v),m(M,v),M.push(e.outputColorSpace)),M.push(v.customProgramCacheKey),M.join()}function g(v,M){v.push(M.precision),v.push(M.outputColorSpace),v.push(M.envMapMode),v.push(M.envMapPMREM),v.push(M.envMapMaxLod),v.push(M.envMapSize),v.push(M.mapUv),v.push(M.alphaMapUv),v.push(M.lightMapUv),v.push(M.aoMapUv),v.push(M.bumpMapUv),v.push(M.normalMapUv),v.push(M.displacementMapUv),v.push(M.emissiveMapUv),v.push(M.metalnessMapUv),v.push(M.roughnessMapUv),v.push(M.anisotropyMapUv),v.push(M.clearcoatMapUv),v.push(M.clearcoatNormalMapUv),v.push(M.clearcoatRoughnessMapUv),v.push(M.diffuseRoughnessMapUv),v.push(M.iridescenceMapUv),v.push(M.iridescenceThicknessMapUv),v.push(M.sheenColorMapUv),v.push(M.sheenRoughnessMapUv),v.push(M.specularMapUv),v.push(M.specularColorMapUv),v.push(M.specularIntensityMapUv),v.push(M.transmissionMapUv),v.push(M.thicknessMapUv),v.push(M.combine),v.push(M.fogExp2),v.push(M.sizeAttenuation),v.push(M.morphTargetsCount),v.push(M.numSunLights),v.push(M.numDirLights),v.push(M.numPointLights),v.push(M.numSpotLights),v.push(M.numSpotLightMaps),v.push(M.numHemiLights),v.push(M.numRectAreaLights),v.push(M.numSunLightShadows),v.push(M.numDirLightShadows),v.push(M.numPointLightShadows),v.push(M.numSpotLightShadows),v.push(M.numSpotLightShadowsWithMaps),v.push(M.numLightProbes),v.push(M.numLightProbeGrids),v.push(M.shadowMapType),v.push(M.toneMapping),v.push(M.numClippingPlanes),v.push(M.numClipIntersection),v.push(M.depthPacking)}function m(v,M){o.disableAll(),M.instancing&&o.enable(0),M.instancingColor&&o.enable(1),M.instancingMorph&&o.enable(2),M.matcap&&o.enable(3),M.envMap&&o.enable(4),M.normalMapObjectSpace&&o.enable(5),M.normalMapTangentSpace&&o.enable(6),M.clearcoat&&o.enable(7),M.iridescence&&o.enable(8),M.alphaTest&&o.enable(9),M.vertexColors&&o.enable(10),M.vertexAlphas&&o.enable(11),M.vertexUv1s&&o.enable(12),M.vertexUv2s&&o.enable(13),M.vertexUv3s&&o.enable(14),M.vertexTangents&&o.enable(15),M.anisotropy&&o.enable(16),M.alphaHash&&o.enable(17),M.batching&&o.enable(18),M.dispersion&&o.enable(19),M.retroreflection&&o.enable(24),M.diffuseRoughness&&o.enable(25),M.batchingColor&&o.enable(20),M.gradientMap&&o.enable(21),M.packedNormalMap&&o.enable(22),M.vertexNormals&&o.enable(23),v.push(o.mask),o.disableAll(),M.fog&&o.enable(0),M.useFog&&o.enable(1),M.flatShading&&o.enable(2),M.logarithmicDepthBuffer&&o.enable(3),M.reversedDepthBuffer&&o.enable(4),M.skinning&&o.enable(5),M.morphTargets&&o.enable(6),M.morphNormals&&o.enable(7),M.morphColors&&o.enable(8),M.premultipliedAlpha&&o.enable(9),M.shadowMapEnabled&&o.enable(10),M.doubleSided&&o.enable(11),M.flipSided&&o.enable(12),M.useDepthPacking&&o.enable(13),M.dithering&&o.enable(14),M.transmission&&o.enable(15),M.sheen&&o.enable(16),M.opaque&&o.enable(17),M.pointsUvs&&o.enable(18),M.decodeVideoTexture&&o.enable(19),M.decodeVideoTextureEmissive&&o.enable(20),M.alphaToCoverage&&o.enable(21),M.numLightProbeGrids>0&&o.enable(22),M.hasPositionAttribute&&o.enable(23),v.push(o.mask)}function y(v){let M=d[v.type],U;if(M){let P=Ni[M];U=Mh.clone(P.uniforms)}else U=v.uniforms;return U}function x(v,M){let U=h.get(M);return U!==void 0?++U.usedTimes:(U=new _E(e,M,v,r),l.push(U),h.set(M,U)),U}function b(v){if(--v.usedTimes===0){let M=l.indexOf(v);l[M]=l[l.length-1],l.pop(),h.delete(v.cacheKey),v.destroy()}}function S(v){a.remove(v)}function w(){a.dispose()}return{getParameters:p,getProgramCacheKey:_,getUniforms:y,acquireProgram:x,releaseProgram:b,releaseShaderCache:S,programs:l,dispose:w}}function xE(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let a=e.get(o);return a===void 0&&(a={},e.set(o,a)),a}function i(o){e.delete(o)}function r(o,a,c){e.get(o)[a]=c}function s(){e=new WeakMap}return{has:t,get:n,remove:i,update:r,dispose:s}}function ME(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function e0(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function n0(){let e=[],t=0,n=[],i=[],r=[];function s(){t=0,n.length=0,i.length=0,r.length=0}function o(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function a(d,f,p,_,g,m){let y=e[t];return y===void 0?(y={id:d.id,object:d,geometry:f,material:p,materialVariant:o(d),groupOrder:_,renderOrder:d.renderOrder,z:g,group:m},e[t]=y):(y.id=d.id,y.object=d,y.geometry=f,y.material=p,y.materialVariant=o(d),y.groupOrder=_,y.renderOrder=d.renderOrder,y.z=g,y.group=m),t++,y}function c(d,f,p,_,g,m,y){y.reversedDepth===!0&&(g=-g);let x=a(d,f,p,_,g,m);p.transmission>0?i.push(x):p.transparent===!0?r.push(x):n.push(x)}function l(d,f,p,_,g,m){let y=a(d,f,p,_,g,m);p.transmission>0?i.unshift(y):p.transparent===!0?r.unshift(y):n.unshift(y)}function h(d,f){n.length>1&&n.sort(d||ME),i.length>1&&i.sort(f||e0),r.length>1&&r.sort(f||e0)}function u(){for(let d=t,f=e.length;d<f;d++){let p=e[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:u,sort:h}}function SE(){let e=new WeakMap;function t(i,r){let s=e.get(i),o;return s===void 0?(o=new n0,e.set(i,[o])):r>=s.length?(o=new n0,s.push(o)):o=s[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}function wE(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new O,color:new Wt};break;case"SpotLight":n={position:new O,direction:new O,color:new Wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new O,color:new Wt,distance:0,decay:0};break;case"HemisphereLight":n={direction:new O,skyColor:new Wt,groundColor:new Wt};break;case"RectAreaLight":n={color:new Wt,position:new O,halfWidth:new O,halfHeight:new O};break}return e[t.id]=n,n}}}function EE(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}var TE=0;function AE(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function CE(e){let t=new wE,n=EE(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new O);let r=new O,s=new Vt,o=new Vt;function a(l){let h=0,u=0,d=0;for(let C=0;C<9;C++)i.probe[C].set(0,0,0);let f=0,p=0,_=0,g=0,m=0,y=0,x=0,b=0,S=0,w=0,v=0,M=0,U=0,P=0;l.sort(AE);for(let C=0,N=l.length;C<N;C++){let T=l[C],I=T.color,B=T.intensity,D=T.distance,j=null;if(T.shadow&&T.shadow.map&&(T.shadow.map.texture.format===Lr?j=T.shadow.map.texture:j=T.shadow.map.depthTexture||T.shadow.map.texture),T.isAmbientLight)h+=I.r*B,u+=I.g*B,d+=I.b*B;else if(T.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(T.sh.coefficients[H],B);P++}else if(T.isSunLight){let H=t.get(T);if(H.color.copy(T.color).multiplyScalar(T.intensity),T.castShadow){let Z=T.shadow,$=n.get(T);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize.copy(Z.mapSize).multiply(Z.getFrameExtents()),i.sunShadow[p]=$,i.sunShadowMap[p]=j;let J=Z.getViewportCount();for(let lt=0;lt<J;lt++)i.sunShadowMatrix[_+lt]=Z.getMatrix(lt),i.sunShadowCascade[_+lt]=Z._cascadeData[lt];_+=J,p++}i.sun[f]=H,f++}else if(T.isDirectionalLight){let H=t.get(T);if(H.color.copy(T.color).multiplyScalar(T.intensity),T.castShadow){let Z=T.shadow,$=n.get(T);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,i.directionalShadow[g]=$,i.directionalShadowMap[g]=j,i.directionalShadowMatrix[g]=T.shadow.matrix,S++}i.directional[g]=H,g++}else if(T.isSpotLight){let H=t.get(T);H.position.setFromMatrixPosition(T.matrixWorld),H.color.copy(I).multiplyScalar(B),H.distance=D,H.coneCos=Math.cos(T.angle),H.penumbraCos=Math.cos(T.angle*(1-T.penumbra)),H.decay=T.decay,i.spot[y]=H;let Z=T.shadow;if(T.map&&(i.spotLightMap[M]=T.map,M++,Z.updateMatrices(T),T.castShadow&&U++),i.spotLightMatrix[y]=Z.matrix,T.castShadow){let $=n.get(T);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,i.spotShadow[y]=$,i.spotShadowMap[y]=j,v++}y++}else if(T.isRectAreaLight){let H=t.get(T);H.color.copy(I).multiplyScalar(B),H.halfWidth.set(T.width*.5,0,0),H.halfHeight.set(0,T.height*.5,0),i.rectArea[x]=H,x++}else if(T.isPointLight){let H=t.get(T);if(H.color.copy(T.color).multiplyScalar(T.intensity),H.distance=T.distance,H.decay=T.decay,T.castShadow){let Z=T.shadow,$=n.get(T);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,$.shadowCameraNear=Z.camera.near,$.shadowCameraFar=Z.camera.far,i.pointShadow[m]=$,i.pointShadowMap[m]=j,i.pointShadowMatrix[m]=T.shadow.matrix,w++}i.point[m]=H,m++}else if(T.isHemisphereLight){let H=t.get(T);H.skyColor.copy(T.color).multiplyScalar(B),H.groundColor.copy(T.groundColor).multiplyScalar(B),i.hemi[b]=H,b++}}x>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Ct.LTC_FLOAT_1,i.rectAreaLTC2=Ct.LTC_FLOAT_2):(i.rectAreaLTC1=Ct.LTC_HALF_1,i.rectAreaLTC2=Ct.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let k=i.hash;(k.sunLength!==f||k.directionalLength!==g||k.pointLength!==m||k.spotLength!==y||k.rectAreaLength!==x||k.hemiLength!==b||k.numSunShadows!==p||k.numDirectionalShadows!==S||k.numPointShadows!==w||k.numSpotShadows!==v||k.numSpotMaps!==M||k.numLightProbes!==P)&&(i.sun.length=f,i.directional.length=g,i.spot.length=y,i.rectArea.length=x,i.point.length=m,i.hemi.length=b,i.sunShadow.length=p,i.sunShadowMap.length=p,i.sunShadowMatrix.length=_,i.sunShadowCascade.length=_,i.directionalShadow.length=S,i.directionalShadowMap.length=S,i.directionalShadowMatrix.length=S,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=v,i.spotShadowMap.length=v,i.spotLightMatrix.length=v+M-U,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=U,i.numLightProbes=P,k.sunLength=f,k.directionalLength=g,k.pointLength=m,k.spotLength=y,k.rectAreaLength=x,k.hemiLength=b,k.numSunShadows=p,k.numDirectionalShadows=S,k.numPointShadows=w,k.numSpotShadows=v,k.numSpotMaps=M,k.numLightProbes=P,i.version=TE++)}function c(l,h){let u=0,d=0,f=0,p=0,_=0,g=0,m=h.matrixWorldInverse;for(let y=0,x=l.length;y<x;y++){let b=l[y];if(b.isSunLight){let S=i.sun[u];S.direction.setFromMatrixPosition(b.matrixWorld),S.direction.transformDirection(m),u++}else if(b.isDirectionalLight){let S=i.directional[d];S.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(m),d++}else if(b.isSpotLight){let S=i.spot[p];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(m),S.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(m),p++}else if(b.isRectAreaLight){let S=i.rectArea[_];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(m),o.identity(),s.copy(b.matrixWorld),s.premultiply(m),o.extractRotation(s),S.halfWidth.set(b.width*.5,0,0),S.halfHeight.set(0,b.height*.5,0),S.halfWidth.applyMatrix4(o),S.halfHeight.applyMatrix4(o),_++}else if(b.isPointLight){let S=i.point[f];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(m),f++}else if(b.isHemisphereLight){let S=i.hemi[g];S.direction.setFromMatrixPosition(b.matrixWorld),S.direction.transformDirection(m),g++}}}return{setup:a,setupView:c,state:i}}function i0(e){let t=new CE(e),n=[],i=[],r=[];function s(u){h.camera=u,n.length=0,i.length=0,r.length=0}function o(u){u.isLightProbeGrid?r.push(u):n.push(u)}function a(u){i.push(u)}function c(){t.setup(n),r.sort((u,d)=>u.priority-d.priority||u.id-d.id)}function l(u){t.setupView(n,u)}let h={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:h,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function RE(e){let t=new WeakMap;function n(r,s=0){let o=t.get(r),a;return o===void 0?(a=new i0(e),t.set(r,[a])):s>=o.length?(a=new i0(e),o.push(a)):a=o[s],a}function i(){t=new WeakMap}return{get:n,dispose:i}}var PE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,IE=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,LE=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],DE=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],r0=new Vt,Ra=new O,fd=new O;function NE(e,t,n){let i=new Tr,r=new ut,s=new ut,o=new Ie,a=new yl,c=new vl,l={},h=n.maxTextureSize,u={[Ir]:rn,[rn]:Ir,[Ii]:Ii},d=new Wn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ut},radius:{value:4}},vertexShader:PE,fragmentShader:IE}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let p=new Ae;p.setAttribute("position",new en(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Ge(p,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=xa;let m=this.type;this.render=function(w,v,M){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;this.type===tg&&(Gt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=xa);let U=e.getRenderTarget(),P=e.getActiveCubeFace(),k=e.getActiveMipmapLevel(),C=e.state;C.setBlending(nr),C.buffers.depth.getReversed()===!0?C.buffers.color.setClear(0,0,0,0):C.buffers.color.setClear(1,1,1,1),C.buffers.depth.setTest(!0),C.setScissorTest(!1);let N=m!==this.type;N&&v.traverse(function(T){T.material&&(Array.isArray(T.material)?T.material.forEach(I=>I.needsUpdate=!0):T.material.needsUpdate=!0)});for(let T=0,I=w.length;T<I;T++){let B=w[T],D=B.shadow;if(D===void 0){Gt("WebGLShadowMap:",B,"has no shadow.");continue}if(D.autoUpdate===!1&&D.needsUpdate===!1)continue;r.copy(D.mapSize);let j=D.getFrameExtents();r.multiply(j),s.copy(D.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/j.x),r.x=s.x*j.x,D.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/j.y),r.y=s.y*j.y,D.mapSize.y=s.y));let H=e.state.buffers.depth.getReversed();if(D.camera._reversedDepth=H,D.map===null||N===!0){if(D.map!==null&&(D.map.depthTexture!==null&&(D.map.depthTexture.dispose(),D.map.depthTexture=null),D.map.dispose()),this.type===co){if(B.isPointLight){Gt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}D.map=new wn(r.x,r.y,{format:Lr,type:qn,minFilter:Sn,magFilter:Sn,generateMipmaps:!1}),D.map.texture.name=B.name+".shadowMap",D.map.depthTexture=new tr(r.x,r.y,ii),D.map.depthTexture.name=B.name+".shadowMapDepth",D.map.depthTexture.format=Ji,D.map.depthTexture.compareFunction=null,D.map.depthTexture.minFilter=Ke,D.map.depthTexture.magFilter=Ke}else B.isPointLight?(D.map=new Ia(r.x),D.map.depthTexture=new ca(r.x,mi)):(D.map=new wn(r.x,r.y),D.map.depthTexture=new tr(r.x,r.y,mi)),D.map.depthTexture.name=B.name+".shadowMap",D.map.depthTexture.format=Ji,this.type===xa?(D.map.depthTexture.compareFunction=H?qf:jf,D.map.depthTexture.minFilter=Sn,D.map.depthTexture.magFilter=Sn):(D.map.depthTexture.compareFunction=null,D.map.depthTexture.minFilter=Ke,D.map.depthTexture.magFilter=Ke);D.camera.updateProjectionMatrix()}D.map.isWebGLCubeRenderTarget!==!0&&(D.map.width!==r.x||D.map.height!==r.y)&&D.map.setSize(r.x,r.y);let Z=D.map.isWebGLCubeRenderTarget?6:D.getViewportCount();B.isPointLight!==!0&&D.updateMatrices(B,M);let $=(D.camera.layers.mask&4294967294)!==0?D.camera.layers:M.layers;for(let J=0;J<Z;J++){let lt=D.getCamera(J);if(B.isPointLight){let K=D.camera,ct=D.matrix,at=B.distance||K.far;at!==K.far&&(K.far=at,K.updateProjectionMatrix()),Ra.setFromMatrixPosition(B.matrixWorld),K.position.copy(Ra),fd.copy(K.position),fd.add(LE[J]),K.up.copy(DE[J]),K.lookAt(fd),K.updateMatrixWorld(),ct.makeTranslation(-Ra.x,-Ra.y,-Ra.z),r0.multiplyMatrices(K.projectionMatrix,K.matrixWorldInverse),D._frustum.setFromProjectionMatrix(r0,K.coordinateSystem,K.reversedDepth)}if(D.map.isWebGLCubeRenderTarget)e.setRenderTarget(D.map,J),e.clear();else{J===0&&(e.setRenderTarget(D.map),e.clear());let K=D.getViewport(J);o.set(s.x*K.x,s.y*K.y,s.x*K.z,s.y*K.w),C.viewport(o)}i=D.getFrustum(J),b(v,M,lt,B,$,this.type)}D.isPointLightShadow!==!0&&this.type===co&&y(D,M),D.needsUpdate=!1}m=this.type,g.needsUpdate=!1,e.setRenderTarget(U,P,k)};function y(w,v){let M=t.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null?w.mapPass=new wn(r.x,r.y,{format:Lr,type:qn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),d.uniforms.shadow_pass.value=w.map.depthTexture,d.uniforms.resolution.value.set(w.map.width,w.map.height),d.uniforms.radius.value=w.radius,e.setRenderTarget(w.mapPass),e.clear(),e.renderBufferDirect(v,null,M,d,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,e.setRenderTarget(w.map),e.clear(),e.renderBufferDirect(v,null,M,f,_,null)}function x(w,v,M,U){let P=null,k=M.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(k!==void 0)P=k;else if(P=M.isPointLight===!0?c:a,e.localClippingEnabled&&v.clipShadows===!0&&Array.isArray(v.clippingPlanes)&&v.clippingPlanes.length!==0||v.displacementMap&&v.displacementScale!==0||v.alphaMap&&v.alphaTest>0||v.map&&v.alphaTest>0||v.alphaToCoverage===!0){let C=P.uuid,N=v.uuid,T=l[C];T===void 0&&(T={},l[C]=T);let I=T[N];I===void 0&&(I=P.clone(),T[N]=I,v.addEventListener("dispose",S)),P=I}if(P.visible=v.visible,P.wireframe=v.wireframe,U===co?P.side=v.shadowSide!==null?v.shadowSide:v.side:P.side=v.shadowSide!==null?v.shadowSide:u[v.side],P.alphaMap=v.alphaMap,P.alphaTest=v.alphaToCoverage===!0?.5:v.alphaTest,P.map=v.map,P.clipShadows=v.clipShadows,P.clippingPlanes=v.clippingPlanes,P.clipIntersection=v.clipIntersection,P.displacementMap=v.displacementMap,P.displacementScale=v.displacementScale,P.displacementBias=v.displacementBias,P.wireframeLinewidth=v.wireframeLinewidth,P.linewidth=v.linewidth,M.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let C=e.properties.get(P);C.light=M}return P}function b(w,v,M,U,P,k){if(w.visible===!1)return;if(w.layers.test(P)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&k===co)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,w.matrixWorld);let T=t.update(w),I=w.material;if(Array.isArray(I)){let B=T.groups;for(let D=0,j=B.length;D<j;D++){let H=B[D],Z=I[H.materialIndex];if(Z&&Z.visible){let $=x(w,Z,U,k);w.onBeforeShadow(e,w,v,M,T,$,H),e.renderBufferDirect(M,null,T,$,w,H),w.onAfterShadow(e,w,v,M,T,$,H)}}}else if(I.visible){let B=x(w,I,U,k);w.onBeforeShadow(e,w,v,M,T,B,null),e.renderBufferDirect(M,null,T,B,w,null),w.onAfterShadow(e,w,v,M,T,B,null)}}let N=w.children;for(let T=0,I=N.length;T<I;T++)b(N[T],v,M,U,P,k)}function S(w){w.target.removeEventListener("dispose",S);for(let M in l){let U=l[M],P=w.target.uuid;P in U&&(U[P].dispose(),delete U[P])}}}function OE(e,t){function n(){let G=!1,et=new Ie,tt=null,St=new Ie(0,0,0,0);return{setMask:function(mt){tt!==mt&&!G&&(e.colorMask(mt,mt,mt,mt),tt=mt)},setLocked:function(mt){G=mt},setClear:function(mt,yt,It,$t,dt){dt===!0&&(mt*=$t,yt*=$t,It*=$t),et.set(mt,yt,It,$t),St.equals(et)===!1&&(e.clearColor(mt,yt,It,$t),St.copy(et))},reset:function(){G=!1,tt=null,St.set(-1,0,0,0)}}}function i(){let G=!1,et=!1,tt=null,St=null,mt=null;return{setReversed:function(yt){if(et!==yt){let It=t.get("EXT_clip_control");yt?It.clipControlEXT(It.LOWER_LEFT_EXT,It.ZERO_TO_ONE_EXT):It.clipControlEXT(It.LOWER_LEFT_EXT,It.NEGATIVE_ONE_TO_ONE_EXT),et=yt;let $t=mt;mt=null,this.setClear($t)}},getReversed:function(){return et},setTest:function(yt){yt?_t(e.DEPTH_TEST):Bt(e.DEPTH_TEST)},setMask:function(yt){tt!==yt&&!G&&(e.depthMask(yt),tt=yt)},setFunc:function(yt){if(et&&(yt=Dg[yt]),St!==yt){switch(yt){case jc:e.depthFunc(e.NEVER);break;case qc:e.depthFunc(e.ALWAYS);break;case Xc:e.depthFunc(e.LESS);break;case js:e.depthFunc(e.LEQUAL);break;case Yc:e.depthFunc(e.EQUAL);break;case Zc:e.depthFunc(e.GEQUAL);break;case Kc:e.depthFunc(e.GREATER);break;case Jc:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}St=yt}},setLocked:function(yt){G=yt},setClear:function(yt){mt!==yt&&(mt=yt,et&&(yt=1-yt),e.clearDepth(yt))},reset:function(){G=!1,tt=null,St=null,mt=null,et=!1}}}function r(){let G=!1,et=null,tt=null,St=null,mt=null,yt=null,It=null,$t=null,dt=null;return{setTest:function(Nt){G||(Nt?_t(e.STENCIL_TEST):Bt(e.STENCIL_TEST))},setMask:function(Nt){et!==Nt&&!G&&(e.stencilMask(Nt),et=Nt)},setFunc:function(Nt,Kt,At){(tt!==Nt||St!==Kt||mt!==At)&&(e.stencilFunc(Nt,Kt,At),tt=Nt,St=Kt,mt=At)},setOp:function(Nt,Kt,At){(yt!==Nt||It!==Kt||$t!==At)&&(e.stencilOp(Nt,Kt,At),yt=Nt,It=Kt,$t=At)},setLocked:function(Nt){G=Nt},setClear:function(Nt){dt!==Nt&&(e.clearStencil(Nt),dt=Nt)},reset:function(){G=!1,et=null,tt=null,St=null,mt=null,yt=null,It=null,$t=null,dt=null}}}let s=new n,o=new i,a=new r,c={},l=new WeakMap,h={},u={},d={},f=new WeakMap,p=[],_=null,g=!1,m=null,y=null,x=null,b=null,S=null,w=null,v=null,M=new Wt(0,0,0),U=0,P=!1,k=null,C=null,N=null,T=null,I=null,B=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),D=!1,j=0,H=e.getParameter(e.VERSION);H.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(H)[1]),D=j>=1):H.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),D=j>=2);let Z=null,$={},J=e.getParameter(e.SCISSOR_BOX),lt=e.getParameter(e.VIEWPORT),K=new Ie().fromArray(J),ct=new Ie().fromArray(lt);function at(G,et,tt,St){let mt=new Uint8Array(4),yt=e.createTexture();e.bindTexture(G,yt),e.texParameteri(G,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(G,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let It=0;It<tt;It++)G===e.TEXTURE_3D||G===e.TEXTURE_2D_ARRAY?e.texImage3D(et,0,e.RGBA,1,1,St,0,e.RGBA,e.UNSIGNED_BYTE,mt):e.texImage2D(et+It,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,mt);return yt}let Pt={};Pt[e.TEXTURE_2D]=at(e.TEXTURE_2D,e.TEXTURE_2D,1),Pt[e.TEXTURE_CUBE_MAP]=at(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),Pt[e.TEXTURE_2D_ARRAY]=at(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),Pt[e.TEXTURE_3D]=at(e.TEXTURE_3D,e.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),_t(e.DEPTH_TEST),o.setFunc(js),Qe(!1),Te(Tf),_t(e.CULL_FACE),He(nr);function _t(G){h[G]!==!0&&(e.enable(G),h[G]=!0)}function Bt(G){h[G]!==!1&&(e.disable(G),h[G]=!1)}function Pe(G,et){return d[G]!==et?(e.bindFramebuffer(G,et),d[G]=et,G===e.DRAW_FRAMEBUFFER&&(d[e.FRAMEBUFFER]=et),G===e.FRAMEBUFFER&&(d[e.DRAW_FRAMEBUFFER]=et),!0):!1}function Ht(G,et){let tt=p,St=!1;if(G){tt=f.get(et),tt===void 0&&(tt=[],f.set(et,tt));let mt=G.textures;if(tt.length!==mt.length||tt[0]!==e.COLOR_ATTACHMENT0){for(let yt=0,It=mt.length;yt<It;yt++)tt[yt]=e.COLOR_ATTACHMENT0+yt;tt.length=mt.length,St=!0}}else tt[0]!==e.BACK&&(tt[0]=e.BACK,St=!0);St&&e.drawBuffers(tt)}function he(G){return _!==G?(e.useProgram(G),_=G,!0):!1}let ge={[as]:e.FUNC_ADD,[ng]:e.FUNC_SUBTRACT,[ig]:e.FUNC_REVERSE_SUBTRACT};ge[rg]=e.MIN,ge[sg]=e.MAX;let ie={[og]:e.ZERO,[ag]:e.ONE,[cg]:e.SRC_COLOR,[Pf]:e.SRC_ALPHA,[pg]:e.SRC_ALPHA_SATURATE,[fg]:e.DST_COLOR,[hg]:e.DST_ALPHA,[lg]:e.ONE_MINUS_SRC_COLOR,[If]:e.ONE_MINUS_SRC_ALPHA,[dg]:e.ONE_MINUS_DST_COLOR,[ug]:e.ONE_MINUS_DST_ALPHA,[mg]:e.CONSTANT_COLOR,[gg]:e.ONE_MINUS_CONSTANT_COLOR,[_g]:e.CONSTANT_ALPHA,[yg]:e.ONE_MINUS_CONSTANT_ALPHA};function He(G,et,tt,St,mt,yt,It,$t,dt,Nt){if(G===nr){g===!0&&(Bt(e.BLEND),g=!1);return}if(g===!1&&(_t(e.BLEND),g=!0),G!==eg){if(G!==m||Nt!==P){if((y!==as||S!==as)&&(e.blendEquation(e.FUNC_ADD),y=as,S=as),Nt)switch(G){case lo:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Af:e.blendFunc(e.ONE,e.ONE);break;case Cf:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Rf:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:qt("WebGLState: Invalid blending: ",G);break}else switch(G){case lo:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Af:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Cf:qt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Rf:qt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:qt("WebGLState: Invalid blending: ",G);break}x=null,b=null,w=null,v=null,M.set(0,0,0),U=0,m=G,P=Nt}return}mt=mt||et,yt=yt||tt,It=It||St,(et!==y||mt!==S)&&(e.blendEquationSeparate(ge[et],ge[mt]),y=et,S=mt),(tt!==x||St!==b||yt!==w||It!==v)&&(e.blendFuncSeparate(ie[tt],ie[St],ie[yt],ie[It]),x=tt,b=St,w=yt,v=It),($t.equals(M)===!1||dt!==U)&&(e.blendColor($t.r,$t.g,$t.b,dt),M.copy($t),U=dt),m=G,P=!1}function Ne(G,et){G.side===Ii?Bt(e.CULL_FACE):_t(e.CULL_FACE);let tt=G.side===rn;et&&(tt=!tt),Qe(tt),G.blending===lo&&G.transparent===!1?He(nr):He(G.blending,G.blendEquation,G.blendSrc,G.blendDst,G.blendEquationAlpha,G.blendSrcAlpha,G.blendDstAlpha,G.blendColor,G.blendAlpha,G.premultipliedAlpha),o.setFunc(G.depthFunc),o.setTest(G.depthTest),o.setMask(G.depthWrite),s.setMask(G.colorWrite);let St=G.stencilWrite;a.setTest(St),St&&(a.setMask(G.stencilWriteMask),a.setFunc(G.stencilFunc,G.stencilRef,G.stencilFuncMask),a.setOp(G.stencilFail,G.stencilZFail,G.stencilZPass)),Ue(G.polygonOffset,G.polygonOffsetFactor,G.polygonOffsetUnits),G.alphaToCoverage===!0?_t(e.SAMPLE_ALPHA_TO_COVERAGE):Bt(e.SAMPLE_ALPHA_TO_COVERAGE)}function Qe(G){k!==G&&(G?e.frontFace(e.CW):e.frontFace(e.CCW),k=G)}function Te(G){G!==Jm?(_t(e.CULL_FACE),G!==C&&(G===Tf?e.cullFace(e.BACK):G===Qm?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):Bt(e.CULL_FACE),C=G}function Un(G){G!==N&&(D&&e.lineWidth(G),N=G)}function Ue(G,et,tt){G?(_t(e.POLYGON_OFFSET_FILL),(T!==et||I!==tt)&&(T=et,I=tt,o.getReversed()&&(et=-et,tt=-tt),e.polygonOffset(et,tt))):Bt(e.POLYGON_OFFSET_FILL)}function Xe(G){G?_t(e.SCISSOR_TEST):Bt(e.SCISSOR_TEST)}function on(G){G===void 0&&(G=e.TEXTURE0+B-1),Z!==G&&(e.activeTexture(G),Z=G)}function Rn(G,et,tt){tt===void 0&&(Z===null?tt=e.TEXTURE0+B-1:tt=Z);let St=$[tt];St===void 0&&(St={type:void 0,texture:void 0},$[tt]=St),(St.type!==G||St.texture!==et)&&(Z!==tt&&(e.activeTexture(tt),Z=tt),e.bindTexture(G,et||Pt[G]),St.type=G,St.texture=et)}function q(){let G=$[Z];G!==void 0&&G.type!==void 0&&(e.bindTexture(G.type,null),G.type=void 0,G.texture=void 0)}function yn(){try{e.compressedTexImage2D(...arguments)}catch(G){qt("WebGLState:",G)}}function ve(){try{e.compressedTexImage3D(...arguments)}catch(G){qt("WebGLState:",G)}}function Me(){try{e.texSubImage2D(...arguments)}catch(G){qt("WebGLState:",G)}}function Et(){try{e.texSubImage3D(...arguments)}catch(G){qt("WebGLState:",G)}}function Oe(){try{e.compressedTexSubImage2D(...arguments)}catch(G){qt("WebGLState:",G)}}function Ot(){try{e.compressedTexSubImage3D(...arguments)}catch(G){qt("WebGLState:",G)}}function Xt(){try{e.texStorage2D(...arguments)}catch(G){qt("WebGLState:",G)}}function L(){try{e.texStorage3D(...arguments)}catch(G){qt("WebGLState:",G)}}function A(){try{e.texImage2D(...arguments)}catch(G){qt("WebGLState:",G)}}function Y(){try{e.texImage3D(...arguments)}catch(G){qt("WebGLState:",G)}}function ht(G){return u[G]!==void 0?u[G]:e.getParameter(G)}function st(G,et){u[G]!==et&&(e.pixelStorei(G,et),u[G]=et)}function Mt(G){K.equals(G)===!1&&(e.scissor(G.x,G.y,G.z,G.w),K.copy(G))}function wt(G){ct.equals(G)===!1&&(e.viewport(G.x,G.y,G.z,G.w),ct.copy(G))}function nt(G,et){let tt=l.get(et);tt===void 0&&(tt=new WeakMap,l.set(et,tt));let St=tt.get(G);St===void 0&&(St=e.getUniformBlockIndex(et,G.name),e.uniformBlockBinding(et,St,St),tt.set(G,St))}function it(G,et,tt){let mt=l.get(et).get(G);c[mt]!==tt&&(e.bindBufferBase(e.UNIFORM_BUFFER,mt,tt),c[mt]=tt)}function xt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),h={},u={},Z=null,$={},d={},c={},f=new WeakMap,p=[],_=null,g=!1,m=null,y=null,x=null,b=null,S=null,w=null,v=null,M=new Wt(0,0,0),U=0,P=!1,k=null,C=null,N=null,T=null,I=null,K.set(0,0,e.canvas.width,e.canvas.height),ct.set(0,0,e.canvas.width,e.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:_t,disable:Bt,bindFramebuffer:Pe,drawBuffers:Ht,useProgram:he,setBlending:He,setMaterial:Ne,setFlipSided:Qe,setCullFace:Te,setLineWidth:Un,setPolygonOffset:Ue,setScissorTest:Xe,activeTexture:on,bindTexture:Rn,unbindTexture:q,compressedTexImage2D:yn,compressedTexImage3D:ve,texImage2D:A,texImage3D:Y,pixelStorei:st,getParameter:ht,updateUBOMapping:nt,uniformBlockBinding:it,texStorage2D:Xt,texStorage3D:L,texSubImage2D:Me,texSubImage3D:Et,compressedTexSubImage2D:Oe,compressedTexSubImage3D:Ot,scissor:Mt,viewport:wt,reset:xt}}function FE(e,t,n,i,r,s,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ut,h=new WeakMap,u=new Set,d,f=new WeakMap,p=new Set,_=new FinalizationRegistry(L=>p.delete(L)),g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(L,A){return g?new OffscreenCanvas(L,A):Xs("canvas")}function y(L,A,Y){let ht=1,st=Xt(L);if((st.width>Y||st.height>Y)&&(ht=Y/Math.max(st.width,st.height)),ht<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){let Mt=Math.floor(ht*st.width),wt=Math.floor(ht*st.height);d===void 0&&(d=m(Mt,wt));let nt=A?m(Mt,wt):d;return nt.width=Mt,nt.height=wt,nt.getContext("2d").drawImage(L,0,0,Mt,wt),Gt("WebGLRenderer: Texture has been resized from ("+st.width+"x"+st.height+") to ("+Mt+"x"+wt+")."),nt}else return"data"in L&&Gt("WebGLRenderer: Image in DataTexture is too big ("+st.width+"x"+st.height+")."),L;return L}function x(L){return L.generateMipmaps}function b(L){e.generateMipmap(L)}function S(L){return L.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?e.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function w(L,A,Y,ht,st,Mt=!1){if(L!==null){if(e[L]!==void 0)return e[L];Gt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let wt;ht&&(wt=t.get("EXT_texture_norm16"),wt||Gt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let nt=A;if(A===e.RED&&(Y===e.FLOAT&&(nt=e.R32F),Y===e.HALF_FLOAT&&(nt=e.R16F),Y===e.UNSIGNED_BYTE&&(nt=e.R8),Y===e.UNSIGNED_SHORT&&wt&&(nt=wt.R16_EXT),Y===e.SHORT&&wt&&(nt=wt.R16_SNORM_EXT)),A===e.RED_INTEGER&&(Y===e.UNSIGNED_BYTE&&(nt=e.R8UI),Y===e.UNSIGNED_SHORT&&(nt=e.R16UI),Y===e.UNSIGNED_INT&&(nt=e.R32UI),Y===e.BYTE&&(nt=e.R8I),Y===e.SHORT&&(nt=e.R16I),Y===e.INT&&(nt=e.R32I)),A===e.RG&&(Y===e.FLOAT&&(nt=e.RG32F),Y===e.HALF_FLOAT&&(nt=e.RG16F),Y===e.UNSIGNED_BYTE&&(nt=e.RG8),Y===e.UNSIGNED_SHORT&&wt&&(nt=wt.RG16_EXT),Y===e.SHORT&&wt&&(nt=wt.RG16_SNORM_EXT)),A===e.RG_INTEGER&&(Y===e.UNSIGNED_BYTE&&(nt=e.RG8UI),Y===e.UNSIGNED_SHORT&&(nt=e.RG16UI),Y===e.UNSIGNED_INT&&(nt=e.RG32UI),Y===e.BYTE&&(nt=e.RG8I),Y===e.SHORT&&(nt=e.RG16I),Y===e.INT&&(nt=e.RG32I)),A===e.RGB_INTEGER&&(Y===e.UNSIGNED_BYTE&&(nt=e.RGB8UI),Y===e.UNSIGNED_SHORT&&(nt=e.RGB16UI),Y===e.UNSIGNED_INT&&(nt=e.RGB32UI),Y===e.BYTE&&(nt=e.RGB8I),Y===e.SHORT&&(nt=e.RGB16I),Y===e.INT&&(nt=e.RGB32I)),A===e.RGBA_INTEGER&&(Y===e.UNSIGNED_BYTE&&(nt=e.RGBA8UI),Y===e.UNSIGNED_SHORT&&(nt=e.RGBA16UI),Y===e.UNSIGNED_INT&&(nt=e.RGBA32UI),Y===e.BYTE&&(nt=e.RGBA8I),Y===e.SHORT&&(nt=e.RGBA16I),Y===e.INT&&(nt=e.RGBA32I)),A===e.RGB&&(Y===e.UNSIGNED_SHORT&&wt&&(nt=wt.RGB16_EXT),Y===e.SHORT&&wt&&(nt=wt.RGB16_SNORM_EXT),Y===e.UNSIGNED_INT_5_9_9_9_REV&&(nt=e.RGB9_E5),Y===e.UNSIGNED_INT_10F_11F_11F_REV&&(nt=e.R11F_G11F_B10F)),A===e.RGBA){let it=Mt?Ko:se.getTransfer(st);Y===e.FLOAT&&(nt=e.RGBA32F),Y===e.HALF_FLOAT&&(nt=e.RGBA16F),Y===e.UNSIGNED_BYTE&&(nt=it===_e?e.SRGB8_ALPHA8:e.RGBA8),Y===e.UNSIGNED_SHORT&&wt&&(nt=wt.RGBA16_EXT),Y===e.SHORT&&wt&&(nt=wt.RGBA16_SNORM_EXT),Y===e.UNSIGNED_SHORT_4_4_4_4&&(nt=e.RGBA4),Y===e.UNSIGNED_SHORT_5_5_5_1&&(nt=e.RGB5_A1)}return(nt===e.R16F||nt===e.R32F||nt===e.RG16F||nt===e.RG32F||nt===e.RGBA16F||nt===e.RGBA32F)&&t.get("EXT_color_buffer_float"),nt}function v(L,A){let Y;return L?A===null||A===mi||A===ls?Y=e.DEPTH24_STENCIL8:A===ii?Y=e.DEPTH32F_STENCIL8:A===uo&&(Y=e.DEPTH24_STENCIL8,Gt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):A===null||A===mi||A===ls?Y=e.DEPTH_COMPONENT24:A===ii?Y=e.DEPTH_COMPONENT32F:A===uo&&(Y=e.DEPTH_COMPONENT16),Y}function M(L,A){return x(L)===!0||L.isFramebufferTexture&&L.minFilter!==Ke&&L.minFilter!==Sn?Math.log2(Math.max(A.width,A.height))+1:L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?A.mipmaps.length:1}function U(L){let A=new WeakRef(L);i.get(L).__ref=A,p.add(A),_.register(L,A,A)}function P(L){let A=i.get(L).__ref;A!==void 0&&(p.delete(A),_.unregister(A))}function k(L){N(L.target)}function C(L){T(L.target)}function N(L){L.removeEventListener("dispose",k),P(L),B(L),L.isVideoTexture&&h.delete(L),L.isHTMLTexture&&u.delete(L)}function T(L){L.removeEventListener("dispose",C),P(L),j(L)}function I(){for(let L of p){let A=L.deref();A!==void 0&&(A.isRenderTarget===!0?T(A):N(A))}p.clear(),u.clear()}function B(L){let A=i.get(L);if(A.__webglInit===void 0)return;let Y=L.source,ht=f.get(Y);if(ht){let st=ht[A.__cacheKey];st.usedTimes--,st.usedTimes===0&&D(L),Object.keys(ht).length===0&&f.delete(Y)}i.remove(L)}function D(L){let A=i.get(L);e.deleteTexture(A.__webglTexture);let Y=L.source,ht=f.get(Y);delete ht[A.__cacheKey],o.memory.textures--}function j(L){let A=i.get(L);A.__depthDisposeCallback&&A.__depthDisposeCallback();let Y=L.depthTexture;if(Y&&Y.renderTarget===L&&N(Y),L.isWebGLCubeRenderTarget)for(let st=0;st<6;st++){if(Array.isArray(A.__webglFramebuffer[st]))for(let Mt=0;Mt<A.__webglFramebuffer[st].length;Mt++)e.deleteFramebuffer(A.__webglFramebuffer[st][Mt]);else e.deleteFramebuffer(A.__webglFramebuffer[st]);A.__webglDepthbuffer&&e.deleteRenderbuffer(A.__webglDepthbuffer[st])}else{if(Array.isArray(A.__webglFramebuffer))for(let st=0;st<A.__webglFramebuffer.length;st++)e.deleteFramebuffer(A.__webglFramebuffer[st]);else e.deleteFramebuffer(A.__webglFramebuffer);if(A.__webglDepthbuffer&&e.deleteRenderbuffer(A.__webglDepthbuffer),A.__webglMultisampledFramebuffer&&e.deleteFramebuffer(A.__webglMultisampledFramebuffer),A.__webglColorRenderbuffer)for(let st=0;st<A.__webglColorRenderbuffer.length;st++)A.__webglColorRenderbuffer[st]&&e.deleteRenderbuffer(A.__webglColorRenderbuffer[st]);A.__webglDepthRenderbuffer&&e.deleteRenderbuffer(A.__webglDepthRenderbuffer)}let ht=L.textures;for(let st=0,Mt=ht.length;st<Mt;st++){let wt=i.get(ht[st]);wt.__webglTexture&&(e.deleteTexture(wt.__webglTexture),o.memory.textures--),i.remove(ht[st])}i.remove(L)}let H=0;function Z(){H=0}function $(){return H}function J(L){H=L}function lt(){let L=H;return L>=r.maxTextures&&Gt("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+r.maxTextures),H+=1,L}function K(L){let A=[];return A.push(L.wrapS),A.push(L.wrapT),A.push(L.wrapR||0),A.push(L.magFilter),A.push(L.minFilter),A.push(L.anisotropy),A.push(L.internalFormat),A.push(L.format),A.push(L.type),A.push(L.generateMipmaps),A.push(L.mipmapsAutoUpdate),A.push(L.premultiplyAlpha),A.push(L.flipY),A.push(L.unpackAlignment),A.push(L.colorSpace),A.join()}function ct(L,A){let Y=i.get(L);if(L.isVideoTexture&&Oe(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&Y.__version!==L.version){let ht=L.image;if(ht===null)Gt("WebGLRenderer: Texture marked for update but no image data found.");else if(ht.complete===!1)Gt("WebGLRenderer: Texture marked for update but image is incomplete");else{Ne(Y,L,A);return}}else L.isExternalTexture&&(Y.__webglTexture=L.sourceTexture?L.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,Y.__webglTexture,e.TEXTURE0+A)}function at(L,A){let Y=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&Y.__version!==L.version){Ne(Y,L,A);return}else L.isExternalTexture&&(Y.__webglTexture=L.sourceTexture?L.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,Y.__webglTexture,e.TEXTURE0+A)}function Pt(L,A){let Y=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&Y.__version!==L.version){Ne(Y,L,A);return}n.bindTexture(e.TEXTURE_3D,Y.__webglTexture,e.TEXTURE0+A)}function _t(L,A){let Y=i.get(L);if(L.version>0&&Y.__version!==L.version){Qe(Y,L,A);return}n.bindTexture(e.TEXTURE_CUBE_MAP,Y.__webglTexture,e.TEXTURE0+A)}let Bt={[Qc]:e.REPEAT,[Ti]:e.CLAMP_TO_EDGE,[tl]:e.MIRRORED_REPEAT},Pe={[Ke]:e.NEAREST,[xg]:e.NEAREST_MIPMAP_NEAREST,[Ma]:e.NEAREST_MIPMAP_LINEAR,[Sn]:e.LINEAR,[Fl]:e.LINEAR_MIPMAP_NEAREST,[ir]:e.LINEAR_MIPMAP_LINEAR},Ht={[Eg]:e.NEVER,[Xf]:e.ALWAYS,[Tg]:e.LESS,[jf]:e.LEQUAL,[Ag]:e.EQUAL,[qf]:e.GEQUAL,[Cg]:e.GREATER,[Rg]:e.NOTEQUAL};function he(L,A){if(A.type===ii&&t.has("OES_texture_float_linear")===!1&&(A.magFilter===Sn||A.magFilter===Fl||A.magFilter===Ma||A.magFilter===ir||A.minFilter===Sn||A.minFilter===Fl||A.minFilter===Ma||A.minFilter===ir)&&Gt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(L,e.TEXTURE_WRAP_S,Bt[A.wrapS]),e.texParameteri(L,e.TEXTURE_WRAP_T,Bt[A.wrapT]),(L===e.TEXTURE_3D||L===e.TEXTURE_2D_ARRAY)&&e.texParameteri(L,e.TEXTURE_WRAP_R,Bt[A.wrapR]),e.texParameteri(L,e.TEXTURE_MAG_FILTER,Pe[A.magFilter]),e.texParameteri(L,e.TEXTURE_MIN_FILTER,Pe[A.minFilter]),A.compareFunction&&(e.texParameteri(L,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(L,e.TEXTURE_COMPARE_FUNC,Ht[A.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(A.magFilter===Ke||A.minFilter!==Ma&&A.minFilter!==ir||A.type===ii&&t.has("OES_texture_float_linear")===!1)return;if(A.anisotropy>1||i.get(A).__currentAnisotropy){let Y=t.get("EXT_texture_filter_anisotropic");e.texParameterf(L,Y.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(A.anisotropy,r.getMaxAnisotropy())),i.get(A).__currentAnisotropy=A.anisotropy}}}function ge(L,A){let Y=!1;L.__webglInit===void 0&&(L.__webglInit=!0,A.addEventListener("dispose",k),U(A));let ht=A.source,st=f.get(ht);st===void 0&&(st={},f.set(ht,st));let Mt=K(A);if(Mt!==L.__cacheKey){st[Mt]===void 0&&(st[Mt]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,Y=!0),st[Mt].usedTimes++;let wt=st[L.__cacheKey];wt!==void 0&&(st[L.__cacheKey].usedTimes--,wt.usedTimes===0&&D(A)),L.__cacheKey=Mt,L.__webglTexture=st[Mt].texture}return Y}function ie(L,A,Y){return Math.floor(Math.floor(L/Y)/A)}function He(L,A,Y,ht){let Mt=L.updateRanges;if(Mt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,A.width,A.height,Y,ht,A.data);else{Mt.sort((G,et)=>G.start-et.start);let wt=0;for(let G=1;G<Mt.length;G++){let et=Mt[wt],tt=Mt[G],St=et.start+et.count,mt=ie(tt.start,A.width,4),yt=ie(et.start,A.width,4);tt.start<=St+1&&mt===yt&&ie(tt.start+tt.count-1,A.width,4)===mt?et.count=Math.max(et.count,tt.start+tt.count-et.start):(++wt,Mt[wt]=tt)}Mt.length=wt+1;let nt=n.getParameter(e.UNPACK_ROW_LENGTH),it=n.getParameter(e.UNPACK_SKIP_PIXELS),xt=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,A.width);for(let G=0,et=Mt.length;G<et;G++){let tt=Mt[G],St=Math.floor(tt.start/4),mt=Math.ceil(tt.count/4),yt=St%A.width,It=Math.floor(St/A.width),$t=mt,dt=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,yt),n.pixelStorei(e.UNPACK_SKIP_ROWS,It),n.texSubImage2D(e.TEXTURE_2D,0,yt,It,$t,dt,Y,ht,A.data)}L.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,nt),n.pixelStorei(e.UNPACK_SKIP_PIXELS,it),n.pixelStorei(e.UNPACK_SKIP_ROWS,xt)}}function Ne(L,A,Y){let ht=e.TEXTURE_2D;(A.isDataArrayTexture||A.isCompressedArrayTexture)&&(ht=e.TEXTURE_2D_ARRAY),A.isData3DTexture&&(ht=e.TEXTURE_3D);let st=ge(L,A),Mt=A.source;n.bindTexture(ht,L.__webglTexture,e.TEXTURE0+Y);let wt=i.get(Mt);if(Mt.version!==wt.__version||st===!0){if(n.activeTexture(e.TEXTURE0+Y),(typeof ImageBitmap<"u"&&A.image instanceof ImageBitmap)===!1){let dt=se.getPrimaries(se.workingColorSpace),Nt=A.colorSpace===sr?null:se.getPrimaries(A.colorSpace),Kt=A.colorSpace===sr||dt===Nt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,A.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Kt)}n.pixelStorei(e.UNPACK_ALIGNMENT,A.unpackAlignment);let it=y(A.image,!1,r.maxTextureSize);it=Ot(A,it);let xt=s.convert(A.format,A.colorSpace),G=s.convert(A.type),et=w(A.internalFormat,xt,G,A.normalized,A.colorSpace,A.isVideoTexture);he(ht,A);let tt,St=A.mipmaps,mt=A.isVideoTexture!==!0,yt=wt.__version===void 0||st===!0,It=Mt.dataReady,$t=M(A,it);if(A.isDepthTexture)et=v(A.format===rr,A.type),yt&&(mt?n.texStorage2D(e.TEXTURE_2D,1,et,it.width,it.height):n.texImage2D(e.TEXTURE_2D,0,et,it.width,it.height,0,xt,G,null));else if(A.isDataTexture)if(St.length>0){mt&&yt&&n.texStorage2D(e.TEXTURE_2D,$t,et,St[0].width,St[0].height);for(let dt=0,Nt=St.length;dt<Nt;dt++)tt=St[dt],mt?It&&n.texSubImage2D(e.TEXTURE_2D,dt,0,0,tt.width,tt.height,xt,G,tt.data):n.texImage2D(e.TEXTURE_2D,dt,et,tt.width,tt.height,0,xt,G,tt.data);A.generateMipmaps=!1}else mt?(yt&&n.texStorage2D(e.TEXTURE_2D,$t,et,it.width,it.height),It&&He(A,it,xt,G)):n.texImage2D(e.TEXTURE_2D,0,et,it.width,it.height,0,xt,G,it.data);else if(A.isCompressedTexture)if(A.isCompressedArrayTexture){mt&&yt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,$t,et,St[0].width,St[0].height,it.depth);for(let dt=0,Nt=St.length;dt<Nt;dt++)if(tt=St[dt],A.format!==gi)if(xt!==null)if(mt){if(It)if(A.layerUpdates.size>0){let Kt=sd(tt.width,tt.height,A.format,A.type);for(let At of A.layerUpdates){let oe=tt.data.subarray(At*Kt/tt.data.BYTES_PER_ELEMENT,(At+1)*Kt/tt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,dt,0,0,At,tt.width,tt.height,1,xt,oe)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,dt,0,0,0,tt.width,tt.height,it.depth,xt,tt.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,dt,et,tt.width,tt.height,it.depth,0,tt.data,0,0);else Gt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else mt?It&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,dt,0,0,0,tt.width,tt.height,it.depth,xt,G,tt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,dt,et,tt.width,tt.height,it.depth,0,xt,G,tt.data);A.layerUpdates.size>0&&A.clearLayerUpdates()}else{mt&&yt&&n.texStorage2D(e.TEXTURE_2D,$t,et,St[0].width,St[0].height);for(let dt=0,Nt=St.length;dt<Nt;dt++)tt=St[dt],A.format!==gi?xt!==null?mt?It&&n.compressedTexSubImage2D(e.TEXTURE_2D,dt,0,0,tt.width,tt.height,xt,tt.data):n.compressedTexImage2D(e.TEXTURE_2D,dt,et,tt.width,tt.height,0,tt.data):Gt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):mt?It&&n.texSubImage2D(e.TEXTURE_2D,dt,0,0,tt.width,tt.height,xt,G,tt.data):n.texImage2D(e.TEXTURE_2D,dt,et,tt.width,tt.height,0,xt,G,tt.data)}else if(A.isDataArrayTexture)if(mt){if(yt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,$t,et,it.width,it.height,it.depth),It)if(A.layerUpdates.size>0){let dt=sd(it.width,it.height,A.format,A.type);for(let Nt of A.layerUpdates){let Kt=it.data.subarray(Nt*dt/it.data.BYTES_PER_ELEMENT,(Nt+1)*dt/it.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,Nt,it.width,it.height,1,xt,G,Kt)}A.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,xt,G,it.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,et,it.width,it.height,it.depth,0,xt,G,it.data);else if(A.isData3DTexture)mt?(yt&&n.texStorage3D(e.TEXTURE_3D,$t,et,it.width,it.height,it.depth),It&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,xt,G,it.data)):n.texImage3D(e.TEXTURE_3D,0,et,it.width,it.height,it.depth,0,xt,G,it.data);else if(A.isFramebufferTexture){if(yt)if(mt)n.texStorage2D(e.TEXTURE_2D,$t,et,it.width,it.height);else{let dt=it.width,Nt=it.height;for(let Kt=0;Kt<$t;Kt++)n.texImage2D(e.TEXTURE_2D,Kt,et,dt,Nt,0,xt,G,null),dt>>=1,Nt>>=1}}else if(A.isHTMLTexture){if("texElementImage2D"in e){let dt=e.canvas;if(dt.hasAttribute("layoutsubtree")||dt.setAttribute("layoutsubtree","true"),it.parentNode!==dt){dt.appendChild(it),u.add(A),dt.onpaint=Nt=>{let Kt=Nt.changedElements;for(let At of u)Kt.includes(At.image)&&(At.needsUpdate=!0)},dt.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,it);else{let Kt=e.RGBA,At=e.RGBA,oe=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,Kt,At,oe,it)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(St.length>0){if(mt&&yt){let dt=Xt(St[0]);n.texStorage2D(e.TEXTURE_2D,$t,et,dt.width,dt.height)}for(let dt=0,Nt=St.length;dt<Nt;dt++)tt=St[dt],mt?It&&n.texSubImage2D(e.TEXTURE_2D,dt,0,0,xt,G,tt):n.texImage2D(e.TEXTURE_2D,dt,et,xt,G,tt);A.generateMipmaps=!1}else if(mt){if(yt){let dt=Xt(it);n.texStorage2D(e.TEXTURE_2D,$t,et,dt.width,dt.height)}It&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,xt,G,it)}else n.texImage2D(e.TEXTURE_2D,0,et,xt,G,it);x(A)&&A.mipmapsAutoUpdate===!0&&b(ht),wt.__version=Mt.version,A.onUpdate&&A.onUpdate(A)}L.__version=A.version}function Qe(L,A,Y){if(A.image.length!==6)return;let ht=ge(L,A),st=A.source;n.bindTexture(e.TEXTURE_CUBE_MAP,L.__webglTexture,e.TEXTURE0+Y);let Mt=i.get(st);if(st.version!==Mt.__version||ht===!0){n.activeTexture(e.TEXTURE0+Y);let wt=se.getPrimaries(se.workingColorSpace),nt=A.colorSpace===sr?null:se.getPrimaries(A.colorSpace),it=A.colorSpace===sr||wt===nt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,A.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,A.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,it);let xt=A.isCompressedTexture||A.image[0].isCompressedTexture,G=A.image[0]&&A.image[0].isDataTexture,et=[];for(let At=0;At<6;At++)!xt&&!G?et[At]=y(A.image[At],!0,r.maxCubemapSize):et[At]=G?A.image[At].image:A.image[At],et[At]=Ot(A,et[At]);let tt=et[0],St=s.convert(A.format,A.colorSpace),mt=s.convert(A.type),yt=w(A.internalFormat,St,mt,A.normalized,A.colorSpace),It=A.isVideoTexture!==!0,$t=Mt.__version===void 0||ht===!0,dt=st.dataReady,Nt=M(A,tt);he(e.TEXTURE_CUBE_MAP,A);let Kt;if(A.isDepthTexture){if(yt=v(A.format===rr,A.type),$t)if(It)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,yt,tt.width,tt.height);else for(let At=0;At<6;At++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,yt,tt.width,tt.height,0,St,mt,null)}else if(xt){It&&$t&&n.texStorage2D(e.TEXTURE_CUBE_MAP,Nt,yt,tt.width,tt.height);for(let At=0;At<6;At++){Kt=et[At].mipmaps;for(let oe=0;oe<Kt.length;oe++){let Se=Kt[oe];A.format!==gi?St!==null?It?dt&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe,0,0,Se.width,Se.height,St,Se.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe,yt,Se.width,Se.height,0,Se.data):Gt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):It?dt&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe,0,0,Se.width,Se.height,St,mt,Se.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe,yt,Se.width,Se.height,0,St,mt,Se.data)}}}else{if(Kt=A.mipmaps,It&&$t){Kt.length>0&&Nt++;let At=Xt(et[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,Nt,yt,At.width,At.height)}for(let At=0;At<6;At++)if(G){It?dt&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,et[At].width,et[At].height,St,mt,et[At].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,yt,et[At].width,et[At].height,0,St,mt,et[At].data);for(let oe=0;oe<Kt.length;oe++){let kn=Kt[oe].image[At].image;It?dt&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe+1,0,0,kn.width,kn.height,St,mt,kn.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe+1,yt,kn.width,kn.height,0,St,mt,kn.data)}}else{It?dt&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,St,mt,et[At]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,yt,St,mt,et[At]);for(let oe=0;oe<Kt.length;oe++){let Se=Kt[oe];It?dt&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe+1,0,0,St,mt,Se.image[At]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+At,oe+1,yt,St,mt,Se.image[At])}}}x(A)&&A.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),Mt.__version=st.version,A.onUpdate&&A.onUpdate(A)}L.__version=A.version}function Te(L,A,Y,ht,st,Mt){let wt=s.convert(Y.format,Y.colorSpace),nt=s.convert(Y.type),it=w(Y.internalFormat,wt,nt,Y.normalized,Y.colorSpace),xt=i.get(A),G=i.get(Y);if(G.__renderTarget=A,!xt.__hasExternalTextures){let et=Math.max(1,A.width>>Mt),tt=Math.max(1,A.height>>Mt);st===e.TEXTURE_3D||st===e.TEXTURE_2D_ARRAY?n.texImage3D(st,Mt,it,et,tt,A.depth,0,wt,nt,null):n.texImage2D(st,Mt,it,et,tt,0,wt,nt,null)}n.bindFramebuffer(e.FRAMEBUFFER,L),Et(A)?a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ht,st,G.__webglTexture,0,Me(A)):(st===e.TEXTURE_2D||st>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&st<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,ht,st,G.__webglTexture,Mt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Un(L,A,Y){if(e.bindRenderbuffer(e.RENDERBUFFER,L),A.depthBuffer){let ht=A.depthTexture,st=ht&&ht.isDepthTexture?ht.type:null,Mt=v(A.stencilBuffer,st),wt=A.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Et(A)?a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Me(A),Mt,A.width,A.height):Y?e.renderbufferStorageMultisample(e.RENDERBUFFER,Me(A),Mt,A.width,A.height):e.renderbufferStorage(e.RENDERBUFFER,Mt,A.width,A.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,wt,e.RENDERBUFFER,L)}else{let ht=A.textures;for(let st=0;st<ht.length;st++){let Mt=ht[st],wt=s.convert(Mt.format,Mt.colorSpace),nt=s.convert(Mt.type),it=w(Mt.internalFormat,wt,nt,Mt.normalized,Mt.colorSpace);Et(A)?a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Me(A),it,A.width,A.height):Y?e.renderbufferStorageMultisample(e.RENDERBUFFER,Me(A),it,A.width,A.height):e.renderbufferStorage(e.RENDERBUFFER,it,A.width,A.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ue(L,A,Y){let ht=A.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,L),!(A.depthTexture&&A.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let st=i.get(A.depthTexture);st.__renderTarget=A;let Mt=ht?A.depthTexture.image[0]:A.depthTexture.image;(!st.__webglTexture||Mt.width!==A.width||Mt.height!==A.height)&&(Mt.width=A.width,Mt.height=A.height,A.depthTexture.needsUpdate=!0),ht?_t(A.depthTexture,0):ct(A.depthTexture,0);let wt=st.__webglTexture,nt=Me(A),it=ht?e.TEXTURE_CUBE_MAP_POSITIVE_X+Y:e.TEXTURE_2D,xt=A.depthTexture.format===rr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(A.depthTexture.format===Ji)Et(A)?a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,xt,it,wt,0,nt):e.framebufferTexture2D(e.FRAMEBUFFER,xt,it,wt,0);else if(A.depthTexture.format===rr)Et(A)?a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,xt,it,wt,0,nt):e.framebufferTexture2D(e.FRAMEBUFFER,xt,it,wt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Xe(L){let A=i.get(L),Y=L.isWebGLCubeRenderTarget===!0;if(A.__boundDepthTexture!==L.depthTexture){let ht=L.depthTexture;if(A.__depthDisposeCallback&&A.__depthDisposeCallback(),ht){let st=()=>{delete A.__boundDepthTexture,delete A.__depthDisposeCallback,ht.removeEventListener("dispose",st)};ht.addEventListener("dispose",st),A.__depthDisposeCallback=st}A.__boundDepthTexture=ht}if(L.depthTexture&&!A.__autoAllocateDepthBuffer)if(Y)for(let ht=0;ht<6;ht++)Ue(A.__webglFramebuffer[ht],L,ht);else L.texture.mipmaps.length>0?Ue(A.__webglFramebuffer[0],L,0):Ue(A.__webglFramebuffer,L,0);else if(Y){A.__webglDepthbuffer=[];for(let ht=0;ht<6;ht++)if(n.bindFramebuffer(e.FRAMEBUFFER,A.__webglFramebuffer[ht]),A.__webglDepthbuffer[ht]===void 0)A.__webglDepthbuffer[ht]=e.createRenderbuffer(),Un(A.__webglDepthbuffer[ht],L,!1);else{let st=L.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Mt=A.__webglDepthbuffer[ht];e.bindRenderbuffer(e.RENDERBUFFER,Mt),e.framebufferRenderbuffer(e.FRAMEBUFFER,st,e.RENDERBUFFER,Mt)}}else if(L.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,A.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,A.__webglFramebuffer),A.__webglDepthbuffer===void 0)A.__webglDepthbuffer=e.createRenderbuffer(),Un(A.__webglDepthbuffer,L,!1);else{let st=L.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Mt=A.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,Mt),e.framebufferRenderbuffer(e.FRAMEBUFFER,st,e.RENDERBUFFER,Mt)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function on(L,A,Y){let ht=i.get(L);A!==void 0&&Te(ht.__webglFramebuffer,L,L.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),Y!==void 0&&Xe(L)}function Rn(L){let A=L.texture,Y=i.get(L),ht=i.get(A);L.addEventListener("dispose",C),U(L);let st=L.textures,Mt=L.isWebGLCubeRenderTarget===!0,wt=st.length>1;if(wt||(ht.__webglTexture===void 0&&(ht.__webglTexture=e.createTexture()),ht.__version=A.version,o.memory.textures++),Mt){Y.__webglFramebuffer=[];for(let nt=0;nt<6;nt++)if(A.mipmaps.length>0){Y.__webglFramebuffer[nt]=[];for(let it=0;it<A.mipmaps.length;it++)Y.__webglFramebuffer[nt][it]=e.createFramebuffer()}else Y.__webglFramebuffer[nt]=e.createFramebuffer()}else{if(A.mipmaps.length>0){Y.__webglFramebuffer=[];for(let nt=0;nt<A.mipmaps.length;nt++)Y.__webglFramebuffer[nt]=e.createFramebuffer()}else Y.__webglFramebuffer=e.createFramebuffer();if(wt)for(let nt=0,it=st.length;nt<it;nt++){let xt=i.get(st[nt]);xt.__webglTexture===void 0&&(xt.__webglTexture=e.createTexture(),o.memory.textures++)}if(L.samples>0&&Et(L)===!1){Y.__webglMultisampledFramebuffer=e.createFramebuffer(),Y.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,Y.__webglMultisampledFramebuffer);for(let nt=0;nt<st.length;nt++){let it=st[nt];Y.__webglColorRenderbuffer[nt]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,Y.__webglColorRenderbuffer[nt]);let xt=s.convert(it.format,it.colorSpace),G=s.convert(it.type),et=w(it.internalFormat,xt,G,it.normalized,it.colorSpace,L.isXRRenderTarget===!0),tt=Me(L);e.renderbufferStorageMultisample(e.RENDERBUFFER,tt,et,L.width,L.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+nt,e.RENDERBUFFER,Y.__webglColorRenderbuffer[nt])}e.bindRenderbuffer(e.RENDERBUFFER,null),L.depthBuffer&&(Y.__webglDepthRenderbuffer=e.createRenderbuffer(),Un(Y.__webglDepthRenderbuffer,L,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(Mt){n.bindTexture(e.TEXTURE_CUBE_MAP,ht.__webglTexture),he(e.TEXTURE_CUBE_MAP,A);for(let nt=0;nt<6;nt++)if(A.mipmaps.length>0)for(let it=0;it<A.mipmaps.length;it++)Te(Y.__webglFramebuffer[nt][it],L,A,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+nt,it);else Te(Y.__webglFramebuffer[nt],L,A,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0);x(A)?b(e.TEXTURE_CUBE_MAP):A.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,A.mipmaps.length-1),n.unbindTexture()}else if(wt){for(let nt=0,it=st.length;nt<it;nt++){let xt=st[nt],G=i.get(xt),et=e.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(et=L.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(et,G.__webglTexture),he(et,xt),Te(Y.__webglFramebuffer,L,xt,e.COLOR_ATTACHMENT0+nt,et,0),x(xt)&&b(et)}n.unbindTexture()}else{let nt=e.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(nt=L.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(nt,ht.__webglTexture),he(nt,A),A.mipmaps.length>0)for(let it=0;it<A.mipmaps.length;it++)Te(Y.__webglFramebuffer[it],L,A,e.COLOR_ATTACHMENT0,nt,it);else Te(Y.__webglFramebuffer,L,A,e.COLOR_ATTACHMENT0,nt,0);x(A)?b(nt):A.mipmaps.length>0&&e.texParameteri(nt,e.TEXTURE_MAX_LEVEL,A.mipmaps.length-1),n.unbindTexture()}L.depthBuffer&&Xe(L)}function q(L){let A=L.textures;for(let Y=0,ht=A.length;Y<ht;Y++){let st=A[Y];if(x(st)&&st.mipmapsAutoUpdate===!0){let Mt=S(L),wt=i.get(st).__webglTexture;n.bindTexture(Mt,wt),b(Mt),n.unbindTexture()}}}let yn=[];function ve(L){if(L.samples>0){if(Et(L)===!1){let A=L.textures,Y=L.width,ht=L.height,st=e.COLOR_BUFFER_BIT,Mt=L.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,wt=i.get(L),nt=A.length>1;if(nt)for(let xt=0;xt<A.length;xt++)n.bindFramebuffer(e.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xt,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,wt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xt,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,wt.__webglMultisampledFramebuffer),L.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,wt.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,wt.__webglFramebuffer);for(let xt=0;xt<A.length;xt++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(st|=e.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(st|=e.STENCIL_BUFFER_BIT)),nt){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,wt.__webglColorRenderbuffer[xt]);let G=i.get(A[xt]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,G,0)}e.blitFramebuffer(0,0,Y,ht,0,0,Y,ht,st,e.NEAREST),c===!0&&(yn.length=0,yn.push(e.COLOR_ATTACHMENT0+xt),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&yn.push(Mt),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,yn))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),nt)for(let xt=0;xt<A.length;xt++){n.bindFramebuffer(e.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xt,e.RENDERBUFFER,wt.__webglColorRenderbuffer[xt]);let G=i.get(A[xt]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,wt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xt,e.TEXTURE_2D,G,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,wt.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&c){let A=L.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[A])}}}function Me(L){return Math.min(r.maxSamples,L.samples)}function Et(L){let A=i.get(L);return L.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&A.__useRenderToTexture!==!1}function Oe(L){let A=o.render.frame;h.get(L)!==A&&(h.set(L,A),L.update())}function Ot(L,A){let Y=L.colorSpace,ht=L.format,st=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||Y!==Zo&&Y!==sr&&(se.getTransfer(Y)===_e?(ht!==gi||st!==Ln)&&Gt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):qt("WebGLTextures: Unsupported texture color space:",Y)),A}function Xt(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(l.width=L.naturalWidth||L.width,l.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(l.width=L.displayWidth,l.height=L.displayHeight):(l.width=L.width,l.height=L.height),l}this.allocateTextureUnit=lt,this.resetTextureUnits=Z,this.getTextureUnits=$,this.setTextureUnits=J,this.setTexture2D=ct,this.setTexture2DArray=at,this.setTexture3D=Pt,this.setTextureCube=_t,this.rebindTextures=on,this.setupRenderTarget=Rn,this.updateRenderTargetMipmap=q,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=Xe,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=Et,this.dispose=I}function UE(e,t){function n(i,r=sr){let s,o=se.getTransfer(r);if(i===Ln)return e.UNSIGNED_BYTE;if(i===kl)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Bl)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Vf)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Hf)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===zf)return e.BYTE;if(i===Gf)return e.SHORT;if(i===uo)return e.UNSIGNED_SHORT;if(i===Ul)return e.INT;if(i===mi)return e.UNSIGNED_INT;if(i===ii)return e.FLOAT;if(i===qn)return e.HALF_FLOAT;if(i===Wf)return e.ALPHA;if(i===$f)return e.RGB;if(i===gi)return e.RGBA;if(i===Ji)return e.DEPTH_COMPONENT;if(i===rr)return e.DEPTH_STENCIL;if(i===zl)return e.RED;if(i===Gl)return e.RED_INTEGER;if(i===Lr)return e.RG;if(i===Vl)return e.RG_INTEGER;if(i===Hl)return e.RGBA_INTEGER;if(i===Sa||i===wa||i===Ea||i===Ta)if(o===_e)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Sa)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===wa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ea)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ta)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Sa)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===wa)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ea)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ta)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Wl||i===$l||i===jl||i===ql)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Wl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===$l)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===jl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ql)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Xl||i===Yl||i===Zl||i===Kl||i===Jl||i===Aa||i===Ql)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Xl||i===Yl)return o===_e?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Zl)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Kl)return s.COMPRESSED_R11_EAC;if(i===Jl)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Aa)return s.COMPRESSED_RG11_EAC;if(i===Ql)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===th||i===eh||i===nh||i===ih||i===rh||i===sh||i===oh||i===ah||i===ch||i===lh||i===hh||i===uh||i===fh||i===dh)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===th)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===eh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===nh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ih)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===rh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===sh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===oh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ah)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ch)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===lh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===hh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===uh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===fh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===dh)return o===_e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ph||i===mh||i===gh)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===ph)return o===_e?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===mh)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===gh)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===_h||i===yh||i===Ca||i===vh)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===_h)return s.COMPRESSED_RED_RGTC1_EXT;if(i===yh)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ca)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ls?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}var kE=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,BE=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,vd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){let i=new la(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let n=t.cameras[0].viewport,i=new Wn({vertexShader:kE,fragmentShader:BE,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Ge(new fa(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},bd=class extends di{constructor(t,n){super();let i=this,r=null,s=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,p=null,_=typeof XRWebGLBinding<"u",g=new vd,m={},y=n.getContextAttributes(),x=null,b=null,S=[],w=[],v=new ut,M=null,U=null,P=new Mn;P.viewport=new Ie;let k=new Mn;k.viewport=new Ie;let C=[P,k],N=new Il,T=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let ct=S[K];return ct===void 0&&(ct=new Qs,S[K]=ct),ct.getTargetRaySpace()},this.getControllerGrip=function(K){let ct=S[K];return ct===void 0&&(ct=new Qs,S[K]=ct),ct.getGripSpace()},this.getHand=function(K){let ct=S[K];return ct===void 0&&(ct=new Qs,S[K]=ct),ct.getHandSpace()};function B(K){let ct=w.indexOf(K.inputSource);if(ct===-1)return;let at=S[ct];at!==void 0&&(at.update(K.inputSource,K.frame,l||o),at.dispatchEvent({type:K.type,data:K.inputSource}))}function D(){r.removeEventListener("select",B),r.removeEventListener("selectstart",B),r.removeEventListener("selectend",B),r.removeEventListener("squeeze",B),r.removeEventListener("squeezestart",B),r.removeEventListener("squeezeend",B),r.removeEventListener("end",D),r.removeEventListener("inputsourceschange",j);for(let K=0;K<S.length;K++){let ct=w[K];ct!==null&&(w[K]=null,S[K].disconnect(ct))}T=null,I=null,g.reset();for(let K in m)delete m[K];if(t.setRenderTarget(x),f=null,d=null,u=null,r=null,b=null,lt.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(v.width,v.height,!1),U!==null){let K=U.camera;K.fov=U.fov,K.zoom=U.zoom,K.updateProjectionMatrix(),U=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){s=K,i.isPresenting===!0&&Gt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&Gt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(r,n)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(K){if(r=K,r!==null){if(x=t.getRenderTarget(),r.addEventListener("select",B),r.addEventListener("selectstart",B),r.addEventListener("selectend",B),r.addEventListener("squeeze",B),r.addEventListener("squeezestart",B),r.addEventListener("squeezeend",B),r.addEventListener("end",D),r.addEventListener("inputsourceschange",j),y.xrCompatible!==!0&&await n.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(v),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let at=null,Pt=null,_t=null;y.depth&&(_t=y.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,at=y.stencil?rr:Ji,Pt=y.stencil?ls:mi);let Bt={colorFormat:n.RGBA8,depthFormat:_t,scaleFactor:s};u=this.getBinding(),d=u.createProjectionLayer(Bt),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),b=new wn(d.textureWidth,d.textureHeight,{format:gi,type:Ln,depthTexture:new tr(d.textureWidth,d.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,at),stencilBuffer:y.stencil,colorSpace:t.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let at={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,n,at),r.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new wn(f.framebufferWidth,f.framebufferHeight,{format:gi,type:Ln,colorSpace:t.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),lt.setContext(r),lt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function j(K){for(let ct=0;ct<K.removed.length;ct++){let at=K.removed[ct],Pt=w.indexOf(at);Pt>=0&&(w[Pt]=null,S[Pt].disconnect(at))}for(let ct=0;ct<K.added.length;ct++){let at=K.added[ct],Pt=w.indexOf(at);if(Pt===-1){for(let Bt=0;Bt<S.length;Bt++)if(Bt>=w.length){w.push(at),Pt=Bt;break}else if(w[Bt]===null){w[Bt]=at,Pt=Bt;break}if(Pt===-1)break}let _t=S[Pt];_t&&_t.connect(at)}}function H(K,ct){ct===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(ct.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(r===null)return;let ct=K.near,at=K.far;g.texture!==null&&(g.depthNear>0&&(ct=g.depthNear),g.depthFar>0&&(at=g.depthFar)),N.near=k.near=P.near=ct,N.far=k.far=P.far=at,(T!==N.near||I!==N.far)&&(r.updateRenderState({depthNear:N.near,depthFar:N.far}),T=N.near,I=N.far),N.layers.mask=K.layers.mask|6,P.layers.mask=N.layers.mask&-5,k.layers.mask=N.layers.mask&-3;let Pt=K.parent,_t=N.cameras;H(N,Pt);for(let Bt=0;Bt<_t.length;Bt++)H(_t[Bt],Pt);N.projectionMatrix.copy(P.projectionMatrix),N.projectionMatrixInverse.copy(P.projectionMatrixInverse),U===null&&K.isPerspectiveCamera&&(U={camera:K,fov:K.fov,zoom:K.zoom}),Z(K,N,Pt)};function Z(K,ct,at){at===null?K.matrix.copy(ct.matrixWorld):(K.matrix.copy(at.matrixWorld),K.matrix.invert(),K.matrix.multiply(ct.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(ct.projectionMatrix),K.projectionMatrixInverse.copy(ct.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Zs*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(K){c=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(N)},this.getCameraTexture=function(K){return m[K]};let $=null;function J(K,ct){if(h=ct.getViewerPose(l||o),p=ct,h!==null){let at=h.views;f!==null&&(t.setRenderTargetFramebuffer(b,f.framebuffer),t.setRenderTarget(b));let Pt=!1;at.length!==N.cameras.length&&(N.cameras.length=0,Pt=!0);for(let Ht=0;Ht<at.length;Ht++){let he=at[Ht],ge=null;if(f!==null)ge=f.getViewport(he);else{let He=u.getViewSubImage(d,he);ge=He.viewport,Ht===0&&(t.setRenderTargetTextures(b,He.colorTexture,He.depthStencilTexture),t.setRenderTarget(b))}let ie=C[Ht];ie===void 0&&(ie=new Mn,ie.layers.enable(Ht),ie.viewport=new Ie,C[Ht]=ie),ie.matrix.fromArray(he.transform.matrix),ie.matrix.decompose(ie.position,ie.quaternion,ie.scale),ie.projectionMatrix.fromArray(he.projectionMatrix),ie.projectionMatrixInverse.copy(ie.projectionMatrix).invert(),ie.viewport.set(ge.x,ge.y,ge.width,ge.height),Ht===0&&(N.matrix.copy(ie.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Pt===!0&&N.cameras.push(ie)}let _t=r.enabledFeatures;if(_t&&_t.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&_){u=i.getBinding();let Ht=u.getDepthInformation(at[0]);Ht&&Ht.isValid&&Ht.texture&&g.init(Ht,r.renderState)}if(_t&&_t.includes("camera-access")&&_){t.state.unbindTexture(),u=i.getBinding();for(let Ht=0;Ht<at.length;Ht++){let he=at[Ht].camera;if(he){let ge=m[he];ge||(ge=new la,m[he]=ge);let ie=u.getCameraImage(he);ge.sourceTexture=ie}}}}for(let at=0;at<S.length;at++){let Pt=w[at],_t=S[at];Pt!==null&&_t!==void 0&&_t.update(Pt,ct,l||o)}$&&$(K,ct),ct.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ct}),p=null}let lt=new s0;lt.setAnimationLoop(J),this.setAnimationLoop=function(K){$=K},this.dispose=function(){}}},zE=new Vt,m0=new Yt;m0.set(-1,0,0,0,1,0,0,0,1);function GE(e,t){function n(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function i(g,m){m.color.getRGB(g.fogColor.value,nd(e)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function r(g,m,y,x,b){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(g,m):m.isMeshLambertMaterial?(s(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(g,m),u(g,m)):m.isMeshPhongMaterial?(s(g,m),h(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(g,m),d(g,m),m.isMeshPhysicalMaterial&&f(g,m,b)):m.isMeshMatcapMaterial?(s(g,m),p(g,m)):m.isMeshDepthMaterial?s(g,m):m.isMeshDistanceMaterial?(s(g,m),_(g,m)):m.isMeshNormalMaterial?s(g,m):m.isLineBasicMaterial?(o(g,m),m.isLineDashedMaterial&&a(g,m)):m.isPointsMaterial?c(g,m,y,x):m.isSpriteMaterial?l(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,n(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,n(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,n(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===rn&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,n(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===rn&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,n(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,n(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,n(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let y=t.get(m),x=y.envMap,b=y.envMapRotation;x&&(g.envMap.value=x,g.envMapRotation.value.setFromMatrix4(zE.makeRotationFromEuler(b)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(m0),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,n(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,n(m.aoMap,g.aoMapTransform))}function o(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,n(m.map,g.mapTransform))}function a(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function c(g,m,y,x){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*y,g.scale.value=x*.5,m.map&&(g.map.value=m.map,n(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,n(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function l(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,n(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,n(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function u(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function d(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,n(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,n(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,y){g.ior.value=m.ior,m.diffuseRoughness>0&&(g.diffuseRoughness.value=m.diffuseRoughness,m.diffuseRoughnessMap&&(g.diffuseRoughnessMap.value=m.diffuseRoughnessMap,n(m.diffuseRoughnessMap,g.diffuseRoughnessMapTransform))),m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,n(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,n(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,n(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,n(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,n(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===rn&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessMinimum,g.iridescenceThicknessMaximum.value=m.iridescenceThicknessMaximum,m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,n(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,n(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=y.texture,g.transmissionSamplerSize.value.set(y.width,y.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,n(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,n(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,n(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,n(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,n(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function _(g,m){let y=t.get(m).light;g.referencePosition.value.setFromMatrixPosition(y.matrixWorld),g.nearDistance.value=y.shadow.camera.near,g.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function VE(e,t,n,i){let r={},s={};function o(y,x){let b=x.program;i.uniformBlockBinding(y,b,r[y.id])}function a(y,x){let b=r[y.id];b===void 0&&(p(y),b=c(y),r[y.id]=b,y.addEventListener("dispose",g));let S=x.program;i.updateUBOMapping(y,S);let w=t.render.frame;s[y.id]!==w&&(l(y),s[y.id]=w)}function c(y){let x=e.createBuffer(),b=y.__size,S=y.usage;return e.bindBuffer(e.UNIFORM_BUFFER,x),e.bufferData(e.UNIFORM_BUFFER,b,S),e.bindBuffer(e.UNIFORM_BUFFER,null),x}function l(y){let x=r[y.id],b=y.uniforms,S=y.__cache;e.bindBuffer(e.UNIFORM_BUFFER,x);for(let w=0,v=b.length;w<v;w++){let M=b[w];if(Array.isArray(M))for(let U=0,P=M.length;U<P;U++)h(M[U],w,U,S);else h(M,w,0,S)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(y,x,b,S){if(d(y,x,b,S)===!0){let w=y.__offset,v=y.value;if(Array.isArray(v)){let M=0;for(let U=0;U<v.length;U++){let P=v[U],k=_(P,!0);u(P,y.__data,M),M+=k.storage/Float32Array.BYTES_PER_ELEMENT}}else u(v,y.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,w,y.__data)}}function u(y,x,b){typeof y=="number"||typeof y=="boolean"?x[b]=y:y.isMatrix3?(x[b]=y.elements[0],x[b+1]=y.elements[1],x[b+2]=y.elements[2],x[b+3]=0,x[b+4]=y.elements[3],x[b+5]=y.elements[4],x[b+6]=y.elements[5],x[b+7]=0,x[b+8]=y.elements[6],x[b+9]=y.elements[7],x[b+10]=y.elements[8],x[b+11]=0):ArrayBuffer.isView(y)?x.set(y.subarray(0,x.length-b),b):y.toArray(x,b)}function d(y,x,b,S){let w=y.value,v=x+"_"+b;if(Array.isArray(w)){S[v]===void 0&&(S[v]=[]);let M=S[v],U=!1;for(let P=0;P<w.length;P++)f(w[P],M,P)===!0&&(U=!0);return U}return f(w,S,v)}function f(y,x,b){if(x[b]===void 0)return typeof y=="number"||typeof y=="boolean"?x[b]=y:ArrayBuffer.isView(y)?x[b]=y.slice():x[b]=y.clone(),!0;{let S=x[b];if(typeof y=="number"||typeof y=="boolean"){if(S!==y)return x[b]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(S.equals(y)===!1)return S.copy(y),!0}}return!1}function p(y){let x=y.uniforms,b=0,S=16;for(let v=0,M=x.length;v<M;v++){let U=Array.isArray(x[v])?x[v]:[x[v]];for(let P=0,k=U.length;P<k;P++){let C=U[P],N=Array.isArray(C.value)?C.value:[C.value],T=Array.isArray(x[v])||Array.isArray(C.value),I=b;for(let D=0,j=N.length;D<j;D++){let H=N[D],Z=_(H,T),$=b%S,J=$%Z.boundary,lt=$+J;b+=J,lt!==0&&S-lt<Z.storage&&(b+=S-lt),D===0&&(I=b),b+=Z.storage}let B=C.type==="int"?Int32Array:C.type==="uint"?Uint32Array:Float32Array;C.__data=new B((b-I)/Float32Array.BYTES_PER_ELEMENT),C.__offset=I}}let w=b%S;return w>0&&(b+=S-w),y.__size=b,y.__cache={},this}function _(y,x){let b={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(b.boundary=4,b.storage=4):y.isVector2?(b.boundary=8,b.storage=8):y.isVector3||y.isColor?(b.boundary=16,b.storage=12):y.isVector4?(b.boundary=16,b.storage=16):y.isMatrix3?(b.boundary=16,b.storage=48):y.isMatrix4?(b.boundary=16,b.storage=64):y.isTexture?Gt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(b.boundary=16,b.storage=y.byteLength):Gt("WebGLRenderer: Unsupported uniform value type.",y),x===!0&&(b.boundary=16,b.storage=Math.ceil(b.storage/16)*16),b}function g(y){let x=y.target;x.removeEventListener("dispose",g),e.deleteBuffer(r[x.id]),delete r[x.id],delete s[x.id]}function m(){for(let y in r)e.deleteBuffer(r[y]);r={},s={}}return{bind:o,update:a,dispose:m}}var HE=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Di=null;function WE(){return Di===null&&(Di=new sa(HE,16,16,Lr,qn),Di.name="DFG_LUT",Di.minFilter=Sn,Di.magFilter=Sn,Di.wrapS=Ti,Di.wrapT=Ti,Di.generateMipmaps=!1,Di.needsUpdate=!0),Di}var Th=class{constructor(t={}){let{canvas:n=Pg(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Ln}=t;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;let _=f,g=new Set([Hl,Vl,Gl]),m=new Set([Ln,mi,uo,ls,kl,Bl]),y=new Uint32Array(4),x=new Int32Array(4),b={textures:[],min:[],max:[],resolution:[]},S=null,w=null,v=[],M=[],U=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Li,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,k=!1,C=null,N=null,T=null,I=null;this._outputColorSpace=We;let B=0,D=0,j=null,H=-1,Z=null,$=new Ie,J=new Ie,lt=null,K=new Wt(0),ct=0,at=n.width,Pt=n.height,_t=1,Bt=null,Pe=null,Ht=new Ie(0,0,at,Pt),he=new Ie(0,0,at,Pt),ge=!1,ie=new Tr,He=new ol,Ne=!1,Qe=!1,Te=new Vt,Un=new O,Ue=new Ie,Xe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},on=!1;function Rn(){return j===null?_t:1}let q=i;function yn(E,R){return n.getContext(E,R)}let ve,Me,Et,Oe,Ot,Xt,L,A,Y,ht,st,Mt,wt,nt,it,xt,G,et,tt,St,mt,yt,It;try{let E={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${"187"}`),n.addEventListener("webglcontextlost",Nt,!1),n.addEventListener("webglcontextrestored",Kt,!1),n.addEventListener("webglcontextcreationerror",At,!1),q===null){let R="webgl2";if(q=yn(R,E),q===null)throw yn(R)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}$t()}catch(E){throw n.removeEventListener("webglcontextlost",Nt,!1),n.removeEventListener("webglcontextrestored",Kt,!1),n.removeEventListener("webglcontextcreationerror",At,!1),qt("WebGLRenderer: "+E.message),E}function $t(){ve=new ew(q),ve.init(),mt=new UE(q,ve),Me=new WS(q,ve,t,mt),Et=new OE(q,ve),Me.reversedDepthBuffer&&d&&Et.buffers.depth.setReversed(!0),N=q.createFramebuffer(),T=q.createFramebuffer(),I=q.createFramebuffer(),Oe=new rw(q),Ot=new xE,Xt=new FE(q,ve,Et,Ot,Me,mt,Oe),L=new tw(P),A=new o1(q),yt=new VS(q,A),Y=new nw(q,A,Oe,yt),ht=new ow(q,Y,A,yt,Oe),et=new sw(q,Me,Xt),it=new $S(Ot),st=new bE(P,L,ve,Me,yt,it),Mt=new GE(P,Ot),wt=new SE,nt=new RE(ve),G=new GS(P,L,Et,ht,p,c),xt=new NE(P,ht,Me),It=new VE(q,Oe,Me,Et),tt=new HS(q,ve,Oe),St=new iw(q,ve,Oe),Oe.programs=st.programs,P.capabilities=Me,P.extensions=ve,P.properties=Ot,P.renderLists=wt,P.shadowMap=xt,P.state=Et,P.info=Oe}_!==Ln&&(U=new cw(_,n.width,n.height,a,r,s));let dt=new bd(P,q);this.xr=dt,this.getContext=function(){return q},this.getContextAttributes=function(){return q.getContextAttributes()},this.forceContextLoss=function(){let E=ve.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=ve.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return _t},this.setPixelRatio=function(E){E!==void 0&&(_t=E,this.setSize(at,Pt,!1))},this.getSize=function(E){return E.set(at,Pt)},this.setSize=function(E,R,W=!0){if(dt.isPresenting){Gt("WebGLRenderer: Can't change size while VR device is presenting.");return}at=E,Pt=R,n.width=Math.floor(E*_t),n.height=Math.floor(R*_t),W===!0&&(n.style.width=E+"px",n.style.height=R+"px"),U!==null&&U.setSize(n.width,n.height),this.setViewport(0,0,E,R)},this.getDrawingBufferSize=function(E){return E.set(at*_t,Pt*_t).floor()},this.setDrawingBufferSize=function(E,R,W){at=E,Pt=R,_t=W,n.width=Math.floor(E*W),n.height=Math.floor(R*W),this.setViewport(0,0,E,R)},this.setEffects=function(E){if(_===Ln){qt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let R=0;R<E.length;R++)if(E[R].isOutputPass===!0){Gt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}U.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy($)},this.getViewport=function(E){return E.copy(Ht)},this.setViewport=function(E,R,W,F){E.isVector4?Ht.set(E.x,E.y,E.z,E.w):Ht.set(E,R,W,F),Et.viewport($.copy(Ht).multiplyScalar(Rn()).round())},this.getScissor=function(E){return E.copy(he)},this.setScissor=function(E,R,W,F){E.isVector4?he.set(E.x,E.y,E.z,E.w):he.set(E,R,W,F),Et.scissor(J.copy(he).multiplyScalar(Rn()).round())},this.getScissorTest=function(){return ge},this.setScissorTest=function(E){Et.setScissorTest(ge=E)},this.setOpaqueSort=function(E){Bt=E},this.setTransparentSort=function(E){Pe=E},this.getClearColor=function(E){return E.copy(G.getClearColor())},this.setClearColor=function(){G.setClearColor(...arguments)},this.getClearAlpha=function(){return G.getClearAlpha()},this.setClearAlpha=function(){G.setClearAlpha(...arguments)},this.clear=function(E=!0,R=!0,W=!0){let F=0;if(E){let V=!1;if(j!==null){let ot=j.texture.format;V=g.has(ot)}if(V){let ot=j.texture.type,gt=m.has(ot),vt=G.getClearColor(),bt=G.getClearAlpha(),Rt=vt.r,X=vt.g,Tt=vt.b;gt?(y[0]=Rt,y[1]=X,y[2]=Tt,y[3]=bt,q.clearBufferuiv(q.COLOR,0,y)):(x[0]=Rt,x[1]=X,x[2]=Tt,x[3]=bt,q.clearBufferiv(q.COLOR,0,x))}else F|=q.COLOR_BUFFER_BIT}R&&(F|=q.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(F|=q.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&q.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),C=E},this.dispose=function(){n.removeEventListener("webglcontextlost",Nt,!1),n.removeEventListener("webglcontextrestored",Kt,!1),n.removeEventListener("webglcontextcreationerror",At,!1),G.dispose(),wt.dispose(),nt.dispose(),Xt.dispose(),Ot.dispose(),L.dispose(),ht.dispose(),Y.dispose(),yt.dispose(),It.dispose(),st.dispose(),dt.dispose(),dt.removeEventListener("sessionstart",Vi),dt.removeEventListener("sessionend",Bn),an.stop()};function Nt(E){E.preventDefault(),Jo("WebGLRenderer: Context Lost."),k=!0}function Kt(){Jo("WebGLRenderer: Context Restored."),k=!1;let E=Oe.autoReset,R=xt.enabled,W=xt.autoUpdate,F=xt.needsUpdate,V=xt.type;$t(),Oe.autoReset=E,xt.enabled=R,xt.autoUpdate=W,xt.needsUpdate=F,xt.type=V}function At(E){qt("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function oe(E){let R=E.target;R.removeEventListener("dispose",oe),Se(R)}function Se(E){kn(E),Ot.remove(E)}function kn(E){let R=Ot.get(E).programs;R!==void 0&&(R.forEach(function(W){st.releaseProgram(W)}),E.isShaderMaterial&&st.releaseShaderCache(E))}this.renderBufferDirect=function(E,R,W,F,V,ot){R===null&&(R=Xe);let gt=V.isMesh&&V.matrixWorld.determinantAffine()<0,vt=pc(E,R,W,F,V);Et.setMaterial(F,gt);let bt=W.index,Rt=1;if(F.wireframe===!0){if(bt=Y.getWireframeAttribute(W),bt===void 0)return;Rt=2}let X=W.drawRange,Tt=W.attributes.position,pt=X.start*Rt,Ut=(X.start+X.count)*Rt;ot!==null&&(pt=Math.max(pt,ot.start*Rt),Ut=Math.min(Ut,(ot.start+ot.count)*Rt)),bt!==null?(pt=Math.max(pt,0),Ut=Math.min(Ut,bt.count)):Tt!=null&&(pt=Math.max(pt,0),Ut=Math.min(Ut,Tt.count));let re=Ut-pt;if(re<0||re===1/0)return;yt.setup(V,F,vt,W,bt);let ue,ce=tt;if(bt!==null&&(ue=A.get(bt),ce=St,ce.setIndex(ue)),V.isMesh)F.wireframe===!0?(Et.setLineWidth(F.wireframeLinewidth*Rn()),ce.setMode(q.LINES)):ce.setMode(q.TRIANGLES);else if(V.isLine){let cn=F.linewidth;cn===void 0&&(cn=1),Et.setLineWidth(cn*Rn()),V.isLineSegments?ce.setMode(q.LINES):V.isLineLoop?ce.setMode(q.LINE_LOOP):ce.setMode(q.LINE_STRIP)}else V.isPoints?ce.setMode(q.POINTS):V.isSprite&&ce.setMode(q.TRIANGLES);if(V.isBatchedMesh)if(ve.get("WEBGL_multi_draw"))ce.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let cn=V._multiDrawStarts,Lt=V._multiDrawCounts,vn=V._multiDrawCount,fe=bt?A.get(bt).bytesPerElement:1,Zr=Ot.get(F).currentProgram.getUniforms();for(let ln=0;ln<vn;ln++)Zr.setValue(q,"_gl_DrawID",ln),ce.render(cn[ln]/fe,Lt[ln])}else if(V.isInstancedMesh)ce.renderInstances(pt,re,V.count);else if(W.isInstancedBufferGeometry){let cn=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Lt=Math.min(W.instanceCount,cn);ce.renderInstances(pt,re,Lt)}else ce.render(pt,re)};function Ss(E,R,W,F){C!==null&&E.isNodeMaterial&&C.setObject(F,E),Ne===!0&&it.setState(E,W,!1),E.transparent===!0&&E.side===Ii&&E.forceSinglePass===!1?(E.side=rn,E.needsUpdate=!0,Yr(E,R,F),E.side=Ir,E.needsUpdate=!0,Yr(E,R,F),E.side=Ii):Yr(E,R,F)}this.compile=function(E,R,W=null){W===null&&(W=E),C!==null&&C.renderStart(E,R,W),w=nt.get(W),w.init(R),M.push(w),W.traverseVisible(function(V){V.isLight&&V.layers.test(R.layers)&&(w.pushLight(V),V.castShadow&&w.pushShadow(V))}),E!==W&&E.traverseVisible(function(V){V.isLight&&V.layers.test(R.layers)&&(w.pushLight(V),V.castShadow&&w.pushShadow(V))}),w.setupLights(),C!==null&&C.updateLights(w.state.lightsArray),Qe=this.localClippingEnabled,Ne=it.init(this.clippingPlanes,Qe),Ne===!0&&it.setGlobalState(this.clippingPlanes,R),C!==null&&xt.render(w.state.shadowsArray,W,R);let F=new Set;return E.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let ot=V.material;if(ot)if(Array.isArray(ot))for(let gt=0;gt<ot.length;gt++){let vt=ot[gt];Ss(vt,W,R,V),F.add(vt)}else Ss(ot,W,R,V),F.add(ot)}),w=M.pop(),C!==null&&C.renderEnd(),F},this.compileAsync=function(E,R,W=null){let F=this.compile(E,R,W);return new Promise(V=>{function ot(){if(F.forEach(function(gt){let bt=Ot.get(gt).currentProgram;(bt===void 0||bt.isReady())&&F.delete(gt)}),F.size===0){V(E);return}setTimeout(ot,10)}ve.get("KHR_parallel_shader_compile")!==null?ot():setTimeout(ot,10)})};let ws=null;function Jn(E){ws&&ws(E)}function Vi(){an.stop()}function Bn(){an.start()}let an=new s0;an.setAnimationLoop(Jn),typeof self<"u"&&an.setContext(self),this.setAnimationLoop=function(E){ws=E,dt.setAnimationLoop(E),E===null?an.stop():an.start()},dt.addEventListener("sessionstart",Vi),dt.addEventListener("sessionend",Bn),this.render=function(E,R){if(R!==void 0&&R.isCamera!==!0){qt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;C!==null&&C.renderStart(E,R);let W=dt.enabled===!0&&dt.isPresenting===!0,F=U!==null&&(j===null||W)&&U.begin(P,j);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),R.parent===null&&R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),dt.enabled===!0&&dt.isPresenting===!0&&(U===null||U.isCompositing()===!1)&&(dt.cameraAutoUpdate===!0&&dt.updateCamera(R),R=dt.getCamera()),E.isScene===!0&&E.onBeforeRender(P,E,R,j),w=nt.get(E,M.length),w.init(R),w.state.textureUnits=Xt.getTextureUnits(),M.push(w),Te.multiplyMatrices(R.projectionMatrix,R.matrixWorldInverse),R.isArrayCamera?He.setFromArrayCamera(R):ie.setFromProjectionMatrix(Te,ti,R.reversedDepth),Qe=this.localClippingEnabled,Ne=it.init(this.clippingPlanes,Qe),S=wt.get(E,v.length),S.init(),v.push(S),this.info.render.frame++,dt.enabled===!0&&dt.isPresenting===!0){let gt=P.xr.getDepthSensingMesh();gt!==null&&zn(gt,R,-1/0,P.sortObjects)}zn(E,R,0,P.sortObjects),S.finish(),C!==null&&C.updateLights(w.state.lightsArray),P.sortObjects===!0&&S.sort(Bt,Pe),on=dt.enabled===!1||dt.isPresenting===!1||dt.hasDepthSensing()===!1,on&&G.addToRenderList(S,E),this.info.autoReset===!0&&this.info.reset(),Ne===!0&&it.beginShadows();let V=w.state.shadowsArray;if(xt.render(V,E,R),Ne===!0&&it.endShadows(),(F&&U.hasRenderPass())===!1){let gt=S.opaque,vt=S.transmissive;if(w.setupLights(),R.isArrayCamera){let bt=R.cameras;if(vt.length>0)for(let Rt=0,X=bt.length;Rt<X;Rt++){let Tt=bt[Rt];fc(gt,vt,E,Tt)}on&&G.render(E);for(let Rt=0,X=bt.length;Rt<X;Rt++){let Tt=bt[Rt];wi(S,E,Tt,Tt.viewport)}}else vt.length>0&&fc(gt,vt,E,R),on&&G.render(E),wi(S,E,R)}j!==null&&D===0&&(Xt.updateMultisampleRenderTarget(j),Xt.updateRenderTargetMipmap(j)),F&&U.end(P),E.isScene===!0&&E.onAfterRender(P,E,R),yt.resetDefaultState(),H=-1,Z=null,M.pop(),M.length>0?(w=M[M.length-1],Xt.setTextureUnits(w.state.textureUnits),Ne===!0&&it.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,v.pop(),v.length>0?S=v[v.length-1]:S=null,C!==null&&C.renderEnd()};function zn(E,R,W,F){if(E.visible===!1)return;if(E.layers.test(R.layers)){if(E.isGroup)W=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(R);else if(E.isLight)w.pushLight(E),E.castShadow&&w.pushShadow(E);else if(E.isSprite){let gt=R.isArrayCamera?He:ie;if(!E.frustumCulled||E.intersectsFrustum(gt)){F&&Ue.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Te);let vt=ht.update(E),bt=E.material;bt.visible&&S.push(E,vt,bt,W,Ue.z,null,R)}}else if(E.isMesh||E.isLine||E.isPoints){let gt=R.isArrayCamera?He:ie;if(!E.frustumCulled||E.intersectsFrustum(gt)){let vt=ht.update(E),bt=E.material;if(F&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Ue.copy(E.boundingSphere.center)):(vt.boundingSphere===null&&vt.computeBoundingSphere(),Ue.copy(vt.boundingSphere.center)),Ue.applyMatrix4(E.matrixWorld).applyMatrix4(Te)),Array.isArray(bt)){let Rt=vt.groups;for(let X=0,Tt=Rt.length;X<Tt;X++){let pt=Rt[X],Ut=bt[pt.materialIndex];Ut&&Ut.visible&&S.push(E,vt,Ut,W,Ue.z,pt,R)}}else bt.visible&&S.push(E,vt,bt,W,Ue.z,null,R)}}}let ot=E.children;for(let gt=0,vt=ot.length;gt<vt;gt++)zn(ot[gt],R,W,F)}function wi(E,R,W,F){let{opaque:V,transmissive:ot,transparent:gt}=E;w.setupLightsView(W),Ne===!0&&it.setGlobalState(P.clippingPlanes,W),F&&Et.viewport($.copy(F)),V.length>0&&mr(V,R,W),ot.length>0&&mr(ot,R,W),gt.length>0&&mr(gt,R,W),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function fc(E,R,W,F){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[F.id]===void 0){let pt=ve.has("EXT_color_buffer_half_float")||ve.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[F.id]=new wn(1,1,{generateMipmaps:!0,type:pt?qn:Ln,minFilter:ir,samples:Math.max(4,Me.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:se.workingColorSpace})}let ot=w.state.transmissionRenderTarget[F.id],gt=F.viewport||$;ot.setSize(gt.z*P.transmissionResolutionScale,gt.w*P.transmissionResolutionScale);let vt=P.getRenderTarget(),bt=P.getActiveCubeFace(),Rt=P.getActiveMipmapLevel();P.setRenderTarget(ot),P.getClearColor(K),ct=P.getClearAlpha(),ct<1&&P.setClearColor(16777215,.5),P.clear(),on&&G.render(W);let X=P.toneMapping;P.toneMapping=Li;let Tt=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),w.setupLightsView(F),Ne===!0&&it.setGlobalState(P.clippingPlanes,F),mr(E,W,F),Xt.updateMultisampleRenderTarget(ot),Xt.updateRenderTargetMipmap(ot),ve.has("WEBGL_multisampled_render_to_texture")===!1){let pt=!1;for(let Ut=0,re=R.length;Ut<re;Ut++){let ue=R[Ut],{object:ce,geometry:cn,material:Lt,group:vn}=ue;if(Lt.side===Ii&&ce.layers.test(F.layers)){let fe=Lt.side;Lt.side=rn,Lt.needsUpdate=!0,Do(ce,W,F,cn,Lt,vn),Lt.side=fe,Lt.needsUpdate=!0,pt=!0}}pt===!0&&(Xt.updateMultisampleRenderTarget(ot),Xt.updateRenderTargetMipmap(ot))}P.setRenderTarget(vt,bt,Rt),P.setClearColor(K,ct),Tt!==void 0&&(F.viewport=Tt),P.toneMapping=X}function mr(E,R,W){let F=R.isScene===!0?R.overrideMaterial:null;for(let V=0,ot=E.length;V<ot;V++){let gt=E[V],{object:vt,geometry:bt,group:Rt}=gt,X=gt.material;X.allowOverride===!0&&F!==null&&(X=F),vt.layers.test(W.layers)&&Do(vt,R,W,bt,X,Rt)}}function Do(E,R,W,F,V,ot){C!==null&&V.isNodeMaterial&&C.setObject(E,V),E.onBeforeRender(P,R,W,F,V,ot),E.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),V.onBeforeRender(P,R,W,F,E,ot),V.transparent===!0&&V.side===Ii&&V.forceSinglePass===!1?(V.side=rn,V.needsUpdate=!0,P.renderBufferDirect(W,R,F,V,E,ot),V.side=Ir,V.needsUpdate=!0,P.renderBufferDirect(W,R,F,V,E,ot),V.side=Ii):P.renderBufferDirect(W,R,F,V,E,ot),E.onAfterRender(P,R,W,F,V,ot)}function Es(E){let R=0;for(let W of E)W.texture!==null&&R++;return R}function Yr(E,R,W){R.isScene!==!0&&(R=Xe);let F=Ot.get(E),V=w.state.lights,ot=w.state.shadowsArray,gt=V.state.version,vt=st.getParameters(E,V.state,ot,R,W,w.state.lightProbeGridArray),bt=st.getProgramCacheKey(vt),Rt=F.programs;F.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?R.environment:null,F.fog=R.fog;let X=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;F.envMap=L.get(E.envMap||F.environment,X),F.envMapRotation=F.environment!==null&&E.envMap===null?R.environmentRotation:E.envMapRotation,Rt===void 0&&(E.addEventListener("dispose",oe),Rt=new Map,F.programs=Rt,F.programVariants=new Map);let Tt=Rt.get(bt);if(Tt!==void 0){if(F.currentProgram===Tt&&F.lightsStateVersion===gt)return dc(E,vt),Tt}else vt.uniforms=st.getUniforms(E),C!==null&&E.isNodeMaterial&&C.build(E,W,vt),E.onBeforeCompile(vt,P),Tt=st.acquireProgram(vt,bt),Rt.set(bt,Tt),F.uniforms=vt.uniforms;let pt=F.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(pt.clippingPlanes=it.uniform),dc(E,vt),F.needsLights=rt(E),F.lightsStateVersion=gt,F.needsLights&&(pt.ambientLightColor.value=V.state.ambient,pt.lightProbe.value=V.state.probe,pt.sunLights.value=V.state.sun,pt.sunLightShadows.value=V.state.sunShadow,pt.directionalLights.value=V.state.directional,pt.directionalLightShadows.value=V.state.directionalShadow,pt.spotLights.value=V.state.spot,pt.spotLightShadows.value=V.state.spotShadow,pt.rectAreaLights.value=V.state.rectArea,pt.ltc_1.value=V.state.rectAreaLTC1,pt.ltc_2.value=V.state.rectAreaLTC2,pt.pointLights.value=V.state.point,pt.pointLightShadows.value=V.state.pointShadow,pt.hemisphereLights.value=V.state.hemi,pt.sunShadowMatrix.value=V.state.sunShadowMatrix,pt.sunShadowCascade.value=V.state.sunShadowCascade,pt.directionalShadowMatrix.value=V.state.directionalShadowMatrix,pt.spotLightMatrix.value=V.state.spotLightMatrix,pt.spotLightMap.value=V.state.spotLightMap,pt.pointShadowMatrix.value=V.state.pointShadowMatrix),F.numLightProbeGrids=Es(w.state.lightProbeGridArray),F.currentProgram=Tt,F.uniformsList=null,Tt}function gr(E,R,W,F,V){let ot=Ot.get(E),gt=ot.currentProgram.id+","+F+","+V,vt=ot.programVariants.get(gt);return vt===void 0?(vt=Yr(E,R,W),ot.programVariants.set(gt,vt)):(ot.currentProgram=vt,ot.uniformsList=null,ot.outputColorSpace=F,ot.toneMapping=V),vt}function Hi(E){if(E.uniformsList===null){let R=E.currentProgram.getUniforms();E.uniformsList=fo.seqWithValue(R.seq,E.uniforms)}return E.uniformsList}function dc(E,R){let W=Ot.get(E);W.outputColorSpace=R.outputColorSpace,W.batching=R.batching,W.batchingColor=R.batchingColor,W.instancing=R.instancing,W.instancingColor=R.instancingColor,W.instancingMorph=R.instancingMorph,W.skinning=R.skinning,W.morphTargets=R.morphTargets,W.morphNormals=R.morphNormals,W.morphColors=R.morphColors,W.morphTargetsCount=R.morphTargetsCount,W.numClippingPlanes=R.numClippingPlanes,W.numIntersection=R.numClipIntersection,W.vertexAlphas=R.vertexAlphas,W.vertexTangents=R.vertexTangents,W.toneMapping=R.toneMapping}function pc(E,R,W,F,V){R.isScene!==!0&&(R=Xe),Xt.resetTextureUnits();let ot=R.fog,gt=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?R.environment:null,vt=j===null?P.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:se.workingColorSpace,bt=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,Rt=L.get(F.envMap||gt,bt),X=F.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Tt=!!W.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),pt=!!W.morphAttributes.position,Ut=!!W.morphAttributes.normal,re=!!W.morphAttributes.color,ue=Li;F.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(ue=P.toneMapping);let ce=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,cn=ce!==void 0?ce.length:0,Lt=Ot.get(F),vn=w.state.lights;if(Ne===!0&&(Qe===!0||E!==Z)){let Fe=E===Z&&F.id===H;it.setState(F,E,Fe)}let fe=!1,Zr=!1;F.version===Lt.__version?Lt.needsLights&&Lt.lightsStateVersion!==vn.state.version||V.isBatchedMesh&&Lt.batching===!1||!V.isBatchedMesh&&Lt.batching===!0||V.isBatchedMesh&&Lt.batchingColor===!0&&V._colorsTexture===null||V.isBatchedMesh&&Lt.batchingColor===!1&&V._colorsTexture!==null||V.isInstancedMesh&&Lt.instancing===!1||!V.isInstancedMesh&&Lt.instancing===!0||V.isSkinnedMesh&&Lt.skinning===!1||!V.isSkinnedMesh&&Lt.skinning===!0||V.isInstancedMesh&&Lt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Lt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Lt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Lt.instancingMorph===!1&&V.morphTexture!==null||Lt.envMap!==Rt||F.fog===!0&&Lt.fog!==ot||Lt.numClippingPlanes!==void 0&&(Lt.numClippingPlanes!==it.numPlanes||Lt.numIntersection!==it.numIntersection)||Lt.vertexAlphas!==X||Lt.vertexTangents!==Tt||Lt.morphTargets!==pt||Lt.morphNormals!==Ut||Lt.morphColors!==re||Lt.morphTargetsCount!==cn||Lt.numLightProbeGrids!==Es(w.state.lightProbeGridArray)?fe=!0:(Lt.outputColorSpace!==vt||Lt.toneMapping!==ue)&&(Zr=!0):(fe=!0,Lt.__version=F.version);let ln=Lt.currentProgram;(fe===!0||Zr===!0)&&(ln=Zr===!0?gr(F,R,V,vt,ue):Yr(F,R,V),C&&F.isNodeMaterial&&C.onUpdateProgram(F,ln,Lt));let mc=!1,_r=!1,Kr=!1,le=ln.getUniforms(),tn=Lt.uniforms;if(Et.useProgram(ln.program)&&(mc=!0,_r=!0,Kr=!0),F.id!==H&&(H=F.id,_r=!0),mc||Z!==E){Et.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),le.setValue(q,"projectionMatrix",E.projectionMatrix),le.setValue(q,"viewMatrix",E.matrixWorldInverse);let Ye=le.map.cameraPosition;Ye!==void 0&&Ye.setValue(q,Un.setFromMatrixPosition(E.matrixWorld)),Me.logarithmicDepthBuffer&&le.setValue(q,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&le.setValue(q,"isOrthographic",E.isOrthographicCamera===!0),Z!==E&&(Z=E,_r=!0,Kr=!0)}if(Lt.needsLights&&(vn.state.sunShadowMap.length>0&&le.setValue(q,"sunShadowMap",vn.state.sunShadowMap,Xt),vn.state.directionalShadowMap.length>0&&le.setValue(q,"directionalShadowMap",vn.state.directionalShadowMap,Xt),vn.state.spotShadowMap.length>0&&le.setValue(q,"spotShadowMap",vn.state.spotShadowMap,Xt),vn.state.pointShadowMap.length>0&&le.setValue(q,"pointShadowMap",vn.state.pointShadowMap,Xt)),V.isSkinnedMesh){le.setOptional(q,V,"bindMatrix"),le.setOptional(q,V,"bindMatrixInverse");let Fe=V.skeleton;Fe&&(Fe.boneTexture===null&&Fe.computeBoneTexture(),le.setValue(q,"boneTexture",Fe.boneTexture,Xt))}V.isBatchedMesh&&(le.setOptional(q,V,"batchingTexture"),le.setValue(q,"batchingTexture",V._matricesTexture,Xt),le.setOptional(q,V,"batchingIdTexture"),le.setValue(q,"batchingIdTexture",V._indirectTexture,Xt),le.setOptional(q,V,"batchingColorTexture"),V._colorsTexture!==null&&le.setValue(q,"batchingColorTexture",V._colorsTexture,Xt));let li=W.morphAttributes;if((li.position!==void 0||li.normal!==void 0||li.color!==void 0)&&et.update(V,W,ln),(_r||Lt.receiveShadow!==V.receiveShadow)&&(Lt.receiveShadow=V.receiveShadow,le.setValue(q,"receiveShadow",V.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&R.environment!==null&&(tn.envMapIntensity.value=R.environmentIntensity),tn.dfgLUT!==void 0&&(tn.dfgLUT.value=WE()),_r){if(le.setValue(q,"toneMappingExposure",P.toneMappingExposure),Lt.needsLights&&z(tn,Kr),ot&&F.fog===!0&&Mt.refreshFogUniforms(tn,ot),Mt.refreshMaterialUniforms(tn,F,_t,Pt,w.state.transmissionRenderTarget[E.id]),Lt.needsLights&&Lt.numLightProbeGrids>0){let Fe=b,Ye=0;for(let Wi of w.state.lightProbeGridArray)Wi.texture!==null&&(Fe.textures[Ye]=Wi.texture,Fe.min[Ye]=Wi.boundingBox.min,Fe.max[Ye]=Wi.boundingBox.max,Fe.resolution[Ye]=Wi.resolution,Ye++);for(let Wi in Fe)Fe[Wi].length=Ye;tn.probesSH.value=Fe.textures,tn.probesMin.value=Fe.min,tn.probesMax.value=Fe.max,tn.probesResolution.value=Fe.resolution}fo.upload(q,Hi(Lt),tn,Xt)}if(F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(fo.upload(q,Hi(Lt),tn,Xt),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&le.setValue(q,"center",V.center),le.setValue(q,"modelViewMatrix",V.modelViewMatrix),le.setValue(q,"normalMatrix",V.normalMatrix),le.setValue(q,"modelMatrix",V.matrixWorld),F.uniformsGroups!==void 0){let Fe=F.uniformsGroups;for(let Ye=0,Wi=Fe.length;Ye<Wi;Ye++){let lm=Fe[Ye];It.update(lm,ln),It.bind(lm,ln)}}return ln}function z(E,R){E.ambientLightColor.needsUpdate=R,E.lightProbe.needsUpdate=R,E.sunLights.needsUpdate=R,E.sunLightShadows.needsUpdate=R,E.directionalLights.needsUpdate=R,E.directionalLightShadows.needsUpdate=R,E.pointLights.needsUpdate=R,E.pointLightShadows.needsUpdate=R,E.spotLights.needsUpdate=R,E.spotLightShadows.needsUpdate=R,E.rectAreaLights.needsUpdate=R,E.hemisphereLights.needsUpdate=R}function rt(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return B},this.getActiveMipmapLevel=function(){return D},this.getRenderTarget=function(){return j},this.setRenderTargetTextures=function(E,R,W){let F=Ot.get(E);F.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),Ot.get(E.texture).__webglTexture=R,Ot.get(E.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:W,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,R){let W=Ot.get(E);W.__webglFramebuffer=R,W.__useDefaultFramebuffer=R===void 0},this.setRenderTarget=function(E,R=0,W=0){j=E,B=R,D=W;let F=null,V=!1,ot=!1;if(E){let vt=Ot.get(E);if(vt.__useDefaultFramebuffer!==void 0){Et.bindFramebuffer(q.FRAMEBUFFER,vt.__webglFramebuffer),$.copy(E.viewport),J.copy(E.scissor),lt=E.scissorTest,Et.viewport($),Et.scissor(J),Et.setScissorTest(lt),H=-1;return}else if(vt.__webglFramebuffer===void 0)Xt.setupRenderTarget(E);else if(vt.__hasExternalTextures)Xt.rebindTextures(E,Ot.get(E.texture).__webglTexture,Ot.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let X=E.depthTexture;if(vt.__boundDepthTexture!==X){if(X!==null&&Ot.has(X)&&(E.width!==X.image.width||E.height!==X.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Xt.setupDepthRenderbuffer(E)}}let bt=E.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(ot=!0);let Rt=Ot.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Rt[R])?F=Rt[R][W]:F=Rt[R],V=!0):E.samples>0&&Xt.useMultisampledRTT(E)===!1?F=Ot.get(E).__webglMultisampledFramebuffer:Array.isArray(Rt)?F=Rt[W]:F=Rt,$.copy(E.viewport),J.copy(E.scissor),lt=E.scissorTest}else $.copy(Ht).multiplyScalar(_t).floor(),J.copy(he).multiplyScalar(_t).floor(),lt=ge;if(W!==0&&(F=N),Et.bindFramebuffer(q.FRAMEBUFFER,F)&&Et.drawBuffers(E,F),Et.viewport($),Et.scissor(J),Et.setScissorTest(lt),V){let vt=Ot.get(E.texture);q.framebufferTexture2D(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_CUBE_MAP_POSITIVE_X+R,vt.__webglTexture,W)}else if(ot){let vt=R;for(let bt=0;bt<E.textures.length;bt++){let Rt=Ot.get(E.textures[bt]);q.framebufferTextureLayer(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0+bt,Rt.__webglTexture,W,vt)}}else if(E!==null&&W!==0){let vt=Ot.get(E.texture);q.framebufferTexture2D(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_2D,vt.__webglTexture,W)}H=-1};function Q(E){let R=Ot.get(E);return(R.__readFormat!==E.format||R.__readType!==E.type)&&(R.__readFormat=E.format,R.__readType=E.type,R.__formatReadable=Me.textureFormatReadable(E.format),R.__typeReadable=Me.textureTypeReadable(E.type)),R}this.readRenderTargetPixels=function(E,R,W,F,V,ot,gt,vt=0){if(!(E&&E.isWebGLRenderTarget)){qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=Ot.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&gt!==void 0&&(bt=bt[gt],Array.isArray(bt)&&(bt=bt[0])),bt){Et.bindFramebuffer(q.FRAMEBUFFER,bt);try{let Rt=E.textures[vt],X=Rt.format,Tt=Rt.type;E.textures.length>1&&q.readBuffer(q.COLOR_ATTACHMENT0+vt);let pt=Q(Rt);if(pt.__formatReadable===!1){qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(pt.__typeReadable===!1){qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}R>=0&&R<=E.width-F&&W>=0&&W<=E.height-V&&q.readPixels(R,W,F,V,mt.convert(X),mt.convert(Tt),ot)}finally{let Rt=j!==null?Ot.get(j).__webglFramebuffer:null;Et.bindFramebuffer(q.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(E,R,W,F,V,ot,gt,vt=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=Ot.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&gt!==void 0&&(bt=bt[gt],Array.isArray(bt)&&(bt=bt[0])),bt)if(R>=0&&R<=E.width-F&&W>=0&&W<=E.height-V){Et.bindFramebuffer(q.FRAMEBUFFER,bt);let Rt=E.textures[vt],X=Rt.format,Tt=Rt.type;E.textures.length>1&&q.readBuffer(q.COLOR_ATTACHMENT0+vt);let pt=Q(Rt);if(pt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(pt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ut=q.createBuffer();q.bindBuffer(q.PIXEL_PACK_BUFFER,Ut),q.bufferData(q.PIXEL_PACK_BUFFER,ot.byteLength,q.STREAM_READ),q.readPixels(R,W,F,V,mt.convert(X),mt.convert(Tt),0),q.bindBuffer(q.PIXEL_PACK_BUFFER,null);let re=j!==null?Ot.get(j).__webglFramebuffer:null;Et.bindFramebuffer(q.FRAMEBUFFER,re);let ue=q.fenceSync(q.SYNC_GPU_COMMANDS_COMPLETE,0);return q.flush(),await Lg(q,ue,4),q.bindBuffer(q.PIXEL_PACK_BUFFER,Ut),q.getBufferSubData(q.PIXEL_PACK_BUFFER,0,ot),q.bindBuffer(q.PIXEL_PACK_BUFFER,null),q.deleteBuffer(Ut),q.deleteSync(ue),ot}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,R=null,W=0){let F=Math.pow(2,-W),V=Math.floor(E.image.width*F),ot=Math.floor(E.image.height*F),gt=R!==null?R.x:0,vt=R!==null?R.y:0;Xt.setTexture2D(E,0),q.copyTexSubImage2D(q.TEXTURE_2D,W,0,0,gt,vt,V,ot),Et.unbindTexture()},this.copyTextureToTexture=function(E,R,W=null,F=null,V=0,ot=0){let gt,vt,bt,Rt,X,Tt,pt,Ut,re,ue=E.isCompressedTexture?E.mipmaps[ot]:E.image;if(W!==null)gt=W.max.x-W.min.x,vt=W.max.y-W.min.y,bt=W.isBox3?W.max.z-W.min.z:1,Rt=W.min.x,X=W.min.y,Tt=W.isBox3?W.min.z:0;else{let le=Math.pow(2,-V);gt=Math.floor(ue.width*le),vt=Math.floor(ue.height*le),E.isDataArrayTexture?bt=ue.depth:E.isData3DTexture?bt=Math.floor(ue.depth*le):bt=1,Rt=0,X=0,Tt=0}F!==null?(pt=F.x,Ut=F.y,re=F.z):(pt=0,Ut=0,re=0);let ce=mt.convert(R.format),cn=mt.convert(R.type),Lt;R.isData3DTexture?(Xt.setTexture3D(R,0),Lt=q.TEXTURE_3D):R.isDataArrayTexture||R.isCompressedArrayTexture?(Xt.setTexture2DArray(R,0),Lt=q.TEXTURE_2D_ARRAY):(Xt.setTexture2D(R,0),Lt=q.TEXTURE_2D),Et.activeTexture(q.TEXTURE0),Et.pixelStorei(q.UNPACK_FLIP_Y_WEBGL,R.flipY),Et.pixelStorei(q.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),Et.pixelStorei(q.UNPACK_ALIGNMENT,R.unpackAlignment);let vn=Et.getParameter(q.UNPACK_ROW_LENGTH),fe=Et.getParameter(q.UNPACK_IMAGE_HEIGHT),Zr=Et.getParameter(q.UNPACK_SKIP_PIXELS),ln=Et.getParameter(q.UNPACK_SKIP_ROWS),mc=Et.getParameter(q.UNPACK_SKIP_IMAGES);Et.pixelStorei(q.UNPACK_ROW_LENGTH,ue.width),Et.pixelStorei(q.UNPACK_IMAGE_HEIGHT,ue.height),Et.pixelStorei(q.UNPACK_SKIP_PIXELS,Rt),Et.pixelStorei(q.UNPACK_SKIP_ROWS,X),Et.pixelStorei(q.UNPACK_SKIP_IMAGES,Tt);let _r=E.isDataArrayTexture||E.isData3DTexture,Kr=R.isDataArrayTexture||R.isData3DTexture;if(E.isDepthTexture){let le=Ot.get(E),tn=Ot.get(R),li=Ot.get(le.__renderTarget),Fe=Ot.get(tn.__renderTarget);Et.bindFramebuffer(q.READ_FRAMEBUFFER,li.__webglFramebuffer),Et.bindFramebuffer(q.DRAW_FRAMEBUFFER,Fe.__webglFramebuffer);for(let Ye=0;Ye<bt;Ye++)_r&&(q.framebufferTextureLayer(q.READ_FRAMEBUFFER,q.COLOR_ATTACHMENT0,Ot.get(E).__webglTexture,V,Tt+Ye),q.framebufferTextureLayer(q.DRAW_FRAMEBUFFER,q.COLOR_ATTACHMENT0,Ot.get(R).__webglTexture,ot,re+Ye)),q.blitFramebuffer(Rt,X,Rt+gt,X+vt,pt,Ut,pt+gt,Ut+vt,q.DEPTH_BUFFER_BIT,q.NEAREST);Et.bindFramebuffer(q.READ_FRAMEBUFFER,null),Et.bindFramebuffer(q.DRAW_FRAMEBUFFER,null)}else if(V!==0||E.isRenderTargetTexture||Ot.has(E)){let le=Ot.get(E),tn=Ot.get(R);Et.bindFramebuffer(q.READ_FRAMEBUFFER,T),Et.bindFramebuffer(q.DRAW_FRAMEBUFFER,I);for(let li=0;li<bt;li++)_r?q.framebufferTextureLayer(q.READ_FRAMEBUFFER,q.COLOR_ATTACHMENT0,le.__webglTexture,V,Tt+li):q.framebufferTexture2D(q.READ_FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_2D,le.__webglTexture,V),Kr?q.framebufferTextureLayer(q.DRAW_FRAMEBUFFER,q.COLOR_ATTACHMENT0,tn.__webglTexture,ot,re+li):q.framebufferTexture2D(q.DRAW_FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_2D,tn.__webglTexture,ot),V!==0?q.blitFramebuffer(Rt,X,Rt+gt,X+vt,pt,Ut,pt+gt,Ut+vt,q.COLOR_BUFFER_BIT,q.NEAREST):Kr?q.copyTexSubImage3D(Lt,ot,pt,Ut,re+li,Rt,X,gt,vt):q.copyTexSubImage2D(Lt,ot,pt,Ut,Rt,X,gt,vt);Et.bindFramebuffer(q.READ_FRAMEBUFFER,null),Et.bindFramebuffer(q.DRAW_FRAMEBUFFER,null)}else Kr?E.isDataTexture||E.isData3DTexture?q.texSubImage3D(Lt,ot,pt,Ut,re,gt,vt,bt,ce,cn,ue.data):R.isCompressedArrayTexture?q.compressedTexSubImage3D(Lt,ot,pt,Ut,re,gt,vt,bt,ce,ue.data):q.texSubImage3D(Lt,ot,pt,Ut,re,gt,vt,bt,ce,cn,ue):E.isDataTexture?q.texSubImage2D(q.TEXTURE_2D,ot,pt,Ut,gt,vt,ce,cn,ue.data):E.isCompressedTexture?q.compressedTexSubImage2D(q.TEXTURE_2D,ot,pt,Ut,ue.width,ue.height,ce,ue.data):q.texSubImage2D(q.TEXTURE_2D,ot,pt,Ut,gt,vt,ce,cn,ue);Et.pixelStorei(q.UNPACK_ROW_LENGTH,vn),Et.pixelStorei(q.UNPACK_IMAGE_HEIGHT,fe),Et.pixelStorei(q.UNPACK_SKIP_PIXELS,Zr),Et.pixelStorei(q.UNPACK_SKIP_ROWS,ln),Et.pixelStorei(q.UNPACK_SKIP_IMAGES,mc),ot===0&&R.generateMipmaps===!0&&R.mipmapsAutoUpdate===!0&&q.generateMipmap(Lt),Et.unbindTexture()},this.initRenderTarget=function(E){Ot.get(E).__webglFramebuffer===void 0&&Xt.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?Xt.setTextureCube(E,0):E.isData3DTexture?Xt.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?Xt.setTexture2DArray(E,0):Xt.setTexture2D(E,0),Et.unbindTexture()},this.resetState=function(){B=0,D=0,j=null,Et.reset(),yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ti}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let n=this.getContext();n.drawingBufferColorSpace=se._getDrawingBufferColorSpace(t),n.unpackColorSpace=se._getUnpackColorSpace()}};var mo=new xn,or=new ut,_0=new O,Md=new ut,Rh=new ut,Ph=new O,Sd=new O,y0=new Vt,v0=new O,b0=new O,mn=null,Oi=null,ar=[],Nr={NONE:-1,PAN:0,ROTATE:1},Ih=class extends jn{constructor(t,n,i=null){super(n,i),this.objects=t,this.recursive=!0,this.transformGroup=!1,this.rotateSpeed=1,this.raycaster=new er,this.mouseButtons={LEFT:ke.PAN,MIDDLE:ke.PAN,RIGHT:ke.ROTATE},this.touches={ONE:ni.PAN},this._onPointerMove=$E.bind(this),this._onPointerDown=jE.bind(this),this._onPointerCancel=qE.bind(this),this._onContextMenu=XE.bind(this),i!==null&&this.connect(i)}connect(t){super.connect(t),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointerup",this._onPointerCancel),this.domElement.addEventListener("pointerleave",this._onPointerCancel),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointerup",this._onPointerCancel),this.domElement.removeEventListener("pointerleave",this._onPointerCancel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction="",this.domElement.style.cursor=""}dispose(){this.disconnect()}_updatePointer(t){let n=this.domElement.getBoundingClientRect();or.x=(t.clientX-n.left)/n.width*2-1,or.y=-(t.clientY-n.top)/n.height*2+1}_updateState(t){let n;if(t.pointerType==="touch")n=this.touches.ONE;else switch(t.button){case 0:n=this.mouseButtons.LEFT;break;case 1:n=this.mouseButtons.MIDDLE;break;case 2:n=this.mouseButtons.RIGHT;break;default:n=null}switch(n){case ke.PAN:case ni.PAN:this.state=Nr.PAN;break;case ke.ROTATE:case ni.ROTATE:this.state=Nr.ROTATE;break;default:this.state=Nr.NONE}}};function $E(e){let t=this.object,n=this.domElement,i=this.raycaster;if(this.enabled!==!1){if(this._updatePointer(e),i.setFromCamera(or,t),mn)this.state===Nr.PAN?i.ray.intersectPlane(mo,Ph)&&(mn.position.copy(Ph.sub(_0).applyMatrix4(y0)),this.dispatchEvent({type:"drag",object:mn})):this.state===Nr.ROTATE&&(Md.subVectors(or,Rh).multiplyScalar(this.rotateSpeed),mn.rotateOnWorldAxis(v0,Md.x),mn.rotateOnWorldAxis(b0.normalize(),-Md.y),this.dispatchEvent({type:"drag",object:mn})),Rh.copy(or);else if(e.pointerType==="mouse"||e.pointerType==="pen")if(ar.length=0,i.setFromCamera(or,t),i.intersectObjects(this.objects,this.recursive,ar),ar.length>0){let r=ar[0].object;mo.setFromNormalAndCoplanarPoint(t.getWorldDirection(mo.normal),Sd.setFromMatrixPosition(r.matrixWorld)),Oi!==r&&Oi!==null&&(this.dispatchEvent({type:"hoveroff",object:Oi}),n.style.cursor="auto",Oi=null),Oi!==r&&(this.dispatchEvent({type:"hoveron",object:r}),n.style.cursor="pointer",Oi=r)}else Oi!==null&&(this.dispatchEvent({type:"hoveroff",object:Oi}),n.style.cursor="auto",Oi=null);Rh.copy(or)}}function jE(e){let t=this.object,n=this.domElement,i=this.raycaster;this.enabled!==!1&&(this._updatePointer(e),this._updateState(e),ar.length=0,i.setFromCamera(or,t),i.intersectObjects(this.objects,this.recursive,ar),ar.length>0&&(this.transformGroup===!0?mn=x0(ar[0].object):mn=ar[0].object,mo.setFromNormalAndCoplanarPoint(t.getWorldDirection(mo.normal),Sd.setFromMatrixPosition(mn.matrixWorld)),i.ray.intersectPlane(mo,Ph)&&(this.state===Nr.PAN?(y0.copy(mn.parent.matrixWorld).invert(),_0.copy(Ph).sub(Sd.setFromMatrixPosition(mn.matrixWorld)),n.style.cursor="move",this.dispatchEvent({type:"dragstart",object:mn})):this.state===Nr.ROTATE&&(v0.set(0,1,0).applyQuaternion(t.quaternion).normalize(),b0.set(1,0,0).applyQuaternion(t.quaternion).normalize(),n.style.cursor="move",this.dispatchEvent({type:"dragstart",object:mn})))),Rh.copy(or))}function qE(){this.enabled!==!1&&(mn&&(this.dispatchEvent({type:"dragend",object:mn}),mn=null),this.domElement.style.cursor=Oi?"pointer":"auto",this.state=Nr.NONE)}function XE(e){this.enabled!==!1&&e.preventDefault()}function x0(e,t=null){return e.isGroup&&(t=e),e.parent===null?t:x0(e.parent,t)}function wd(e,t,n){var i,r=1;e==null&&(e=0),t==null&&(t=0),n==null&&(n=0);function s(){var o,a=i.length,c,l=0,h=0,u=0;for(o=0;o<a;++o)c=i[o],l+=c.x||0,h+=c.y||0,u+=c.z||0;for(l=(l/a-e)*r,h=(h/a-t)*r,u=(u/a-n)*r,o=0;o<a;++o)c=i[o],l&&(c.x-=l),h&&(c.y-=h),u&&(c.z-=u)}return s.initialize=function(o){i=o},s.x=function(o){return arguments.length?(e=+o,s):e},s.y=function(o){return arguments.length?(t=+o,s):t},s.z=function(o){return arguments.length?(n=+o,s):n},s.strength=function(o){return arguments.length?(r=+o,s):r},s}function M0(e){let t=+this._x.call(null,e);return S0(this.cover(t),t,e)}function S0(e,t,n){if(isNaN(t))return e;var i,r=e._root,s={data:n},o=e._x0,a=e._x1,c,l,h,u,d;if(!r)return e._root=s,e;for(;r.length;)if((h=t>=(c=(o+a)/2))?o=c:a=c,i=r,!(r=r[u=+h]))return i[u]=s,e;if(l=+e._x.call(null,r.data),t===l)return s.next=r,i?i[u]=s:e._root=s,e;do i=i?i[u]=new Array(2):e._root=new Array(2),(h=t>=(c=(o+a)/2))?o=c:a=c;while((u=+h)==(d=+(l>=c)));return i[d]=r,i[u]=s,e}function w0(e){Array.isArray(e)||(e=Array.from(e));let t=e.length,n=new Float64Array(t),i=1/0,r=-1/0;for(let s=0,o;s<t;++s)isNaN(o=+this._x.call(null,e[s]))||(n[s]=o,o<i&&(i=o),o>r&&(r=o));if(i>r)return this;this.cover(i).cover(r);for(let s=0;s<t;++s)S0(this,n[s],e[s]);return this}function E0(e){if(isNaN(e=+e))return this;var t=this._x0,n=this._x1;if(isNaN(t))n=(t=Math.floor(e))+1;else{for(var i=n-t||1,r=this._root,s,o;t>e||e>=n;)switch(o=+(e<t),s=new Array(2),s[o]=r,r=s,i*=2,o){case 0:n=t+i;break;case 1:t=n-i;break}this._root&&this._root.length&&(this._root=r)}return this._x0=t,this._x1=n,this}function T0(){var e=[];return this.visit(function(t){if(!t.length)do e.push(t.data);while(t=t.next)}),e}function A0(e){return arguments.length?this.cover(+e[0][0]).cover(+e[1][0]):isNaN(this._x0)?void 0:[[this._x0],[this._x1]]}function ri(e,t,n){this.node=e,this.x0=t,this.x1=n}function C0(e,t){var n,i=this._x0,r,s,o=this._x1,a=[],c=this._root,l,h;for(c&&a.push(new ri(c,i,o)),t==null?t=1/0:(i=e-t,o=e+t);l=a.pop();)if(!(!(c=l.node)||(r=l.x0)>o||(s=l.x1)<i))if(c.length){var u=(r+s)/2;a.push(new ri(c[1],u,s),new ri(c[0],r,u)),(h=+(e>=u))&&(l=a[a.length-1],a[a.length-1]=a[a.length-1-h],a[a.length-1-h]=l)}else{var d=Math.abs(e-+this._x.call(null,c.data));d<t&&(t=d,i=e-d,o=e+d,n=c.data)}return n}function R0(e){if(isNaN(c=+this._x.call(null,e)))return this;var t,n=this._root,i,r,s,o=this._x0,a=this._x1,c,l,h,u,d;if(!n)return this;if(n.length)for(;;){if((h=c>=(l=(o+a)/2))?o=l:a=l,t=n,!(n=n[u=+h]))return this;if(!n.length)break;t[u+1&1]&&(i=t,d=u)}for(;n.data!==e;)if(r=n,!(n=n.next))return this;return(s=n.next)&&delete n.next,r?(s?r.next=s:delete r.next,this):t?(s?t[u]=s:delete t[u],(n=t[0]||t[1])&&n===(t[1]||t[0])&&!n.length&&(i?i[d]=n:this._root=n),this):(this._root=s,this)}function P0(e){for(var t=0,n=e.length;t<n;++t)this.remove(e[t]);return this}function I0(){return this._root}function L0(){var e=0;return this.visit(function(t){if(!t.length)do++e;while(t=t.next)}),e}function D0(e){var t=[],n,i=this._root,r,s,o;for(i&&t.push(new ri(i,this._x0,this._x1));n=t.pop();)if(!e(i=n.node,s=n.x0,o=n.x1)&&i.length){var a=(s+o)/2;(r=i[1])&&t.push(new ri(r,a,o)),(r=i[0])&&t.push(new ri(r,s,a))}return this}function N0(e){var t=[],n=[],i;for(this._root&&t.push(new ri(this._root,this._x0,this._x1));i=t.pop();){var r=i.node;if(r.length){var s,o=i.x0,a=i.x1,c=(o+a)/2;(s=r[0])&&t.push(new ri(s,o,c)),(s=r[1])&&t.push(new ri(s,c,a))}n.push(i)}for(;i=n.pop();)e(i.node,i.x0,i.x1);return this}function O0(e){return e[0]}function F0(e){return arguments.length?(this._x=e,this):this._x}function Da(e,t){var n=new Ed(t??O0,NaN,NaN);return e==null?n:n.addAll(e)}function Ed(e,t,n){this._x=e,this._x0=t,this._x1=n,this._root=void 0}function U0(e){for(var t={data:e.data},n=t;e=e.next;)n=n.next={data:e.data};return t}var Dn=Da.prototype=Ed.prototype;Dn.copy=function(){var e=new Ed(this._x,this._x0,this._x1),t=this._root,n,i;if(!t)return e;if(!t.length)return e._root=U0(t),e;for(n=[{source:t,target:e._root=new Array(2)}];t=n.pop();)for(var r=0;r<2;++r)(i=t.source[r])&&(i.length?n.push({source:i,target:t.target[r]=new Array(2)}):t.target[r]=U0(i));return e};Dn.add=M0;Dn.addAll=w0;Dn.cover=E0;Dn.data=T0;Dn.extent=A0;Dn.find=C0;Dn.remove=R0;Dn.removeAll=P0;Dn.root=I0;Dn.size=L0;Dn.visit=D0;Dn.visitAfter=N0;Dn.x=F0;function YE(e){let t=+this._x.call(null,e),n=+this._y.call(null,e);return B0(this.cover(t,n),t,n,e)}function B0(e,t,n,i){if(isNaN(t)||isNaN(n))return e;var r,s=e._root,o={data:i},a=e._x0,c=e._y0,l=e._x1,h=e._y1,u,d,f,p,_,g,m,y;if(!s)return e._root=o,e;for(;s.length;)if((_=t>=(u=(a+l)/2))?a=u:l=u,(g=n>=(d=(c+h)/2))?c=d:h=d,r=s,!(s=s[m=g<<1|_]))return r[m]=o,e;if(f=+e._x.call(null,s.data),p=+e._y.call(null,s.data),t===f&&n===p)return o.next=s,r?r[m]=o:e._root=o,e;do r=r?r[m]=new Array(4):e._root=new Array(4),(_=t>=(u=(a+l)/2))?a=u:l=u,(g=n>=(d=(c+h)/2))?c=d:h=d;while((m=g<<1|_)===(y=(p>=d)<<1|f>=u));return r[y]=s,r[m]=o,e}function ZE(e){Array.isArray(e)||(e=Array.from(e));let t=e.length,n=new Float64Array(t),i=new Float64Array(t),r=1/0,s=r,o=-r,a=o;for(let c=0,l,h,u;c<t;++c){if(isNaN(h=+this._x.call(null,l=e[c]))||isNaN(u=+this._y.call(null,l))){n[c]=NaN;continue}n[c]=h,i[c]=u,h<r&&(r=h),h>o&&(o=h),u<s&&(s=u),u>a&&(a=u)}if(r>o||s>a)return this;this.cover(r,s).cover(o,a);for(let c=0;c<t;++c)B0(this,n[c],i[c],e[c]);return this}function KE(e,t){if(isNaN(e=+e)||isNaN(t=+t))return this;var n=this._x0,i=this._y0,r=this._x1,s=this._y1;if(isNaN(n))r=(n=Math.floor(e))+1,s=(i=Math.floor(t))+1;else{for(var o=r-n||1,a=this._root,c,l;n>e||e>=r||i>t||t>=s;)switch(l=(t<i)<<1|e<n,c=new Array(4),c[l]=a,a=c,o*=2,l){case 0:r=n+o,s=i+o;break;case 1:n=r-o,s=i+o;break;case 2:r=n+o,i=s-o;break;case 3:n=r-o,i=s-o;break}this._root&&this._root.length&&(this._root=a)}return this._x0=n,this._y0=i,this._x1=r,this._y1=s,this}function JE(){var e=[];return this.visit(function(t){if(!t.length)do e.push(t.data);while(t=t.next)}),e}function QE(e){return arguments.length?this.cover(+e[0][0],+e[0][1]).cover(+e[1][0],+e[1][1]):isNaN(this._x0)?void 0:[[this._x0,this._y0],[this._x1,this._y1]]}function En(e,t,n,i,r){this.node=e,this.x0=t,this.y0=n,this.x1=i,this.y1=r}function tT(e,t,n){var i,r=this._x0,s=this._y0,o,a,c,l,h=this._x1,u=this._y1,d=[],f=this._root,p,_;for(f&&d.push(new En(f,r,s,h,u)),n==null?n=1/0:(r=e-n,s=t-n,h=e+n,u=t+n,n*=n);p=d.pop();)if(!(!(f=p.node)||(o=p.x0)>h||(a=p.y0)>u||(c=p.x1)<r||(l=p.y1)<s))if(f.length){var g=(o+c)/2,m=(a+l)/2;d.push(new En(f[3],g,m,c,l),new En(f[2],o,m,g,l),new En(f[1],g,a,c,m),new En(f[0],o,a,g,m)),(_=(t>=m)<<1|e>=g)&&(p=d[d.length-1],d[d.length-1]=d[d.length-1-_],d[d.length-1-_]=p)}else{var y=e-+this._x.call(null,f.data),x=t-+this._y.call(null,f.data),b=y*y+x*x;if(b<n){var S=Math.sqrt(n=b);r=e-S,s=t-S,h=e+S,u=t+S,i=f.data}}return i}function eT(e){if(isNaN(h=+this._x.call(null,e))||isNaN(u=+this._y.call(null,e)))return this;var t,n=this._root,i,r,s,o=this._x0,a=this._y0,c=this._x1,l=this._y1,h,u,d,f,p,_,g,m;if(!n)return this;if(n.length)for(;;){if((p=h>=(d=(o+c)/2))?o=d:c=d,(_=u>=(f=(a+l)/2))?a=f:l=f,t=n,!(n=n[g=_<<1|p]))return this;if(!n.length)break;(t[g+1&3]||t[g+2&3]||t[g+3&3])&&(i=t,m=g)}for(;n.data!==e;)if(r=n,!(n=n.next))return this;return(s=n.next)&&delete n.next,r?(s?r.next=s:delete r.next,this):t?(s?t[g]=s:delete t[g],(n=t[0]||t[1]||t[2]||t[3])&&n===(t[3]||t[2]||t[1]||t[0])&&!n.length&&(i?i[m]=n:this._root=n),this):(this._root=s,this)}function nT(e){for(var t=0,n=e.length;t<n;++t)this.remove(e[t]);return this}function iT(){return this._root}function rT(){var e=0;return this.visit(function(t){if(!t.length)do++e;while(t=t.next)}),e}function sT(e){var t=[],n,i=this._root,r,s,o,a,c;for(i&&t.push(new En(i,this._x0,this._y0,this._x1,this._y1));n=t.pop();)if(!e(i=n.node,s=n.x0,o=n.y0,a=n.x1,c=n.y1)&&i.length){var l=(s+a)/2,h=(o+c)/2;(r=i[3])&&t.push(new En(r,l,h,a,c)),(r=i[2])&&t.push(new En(r,s,h,l,c)),(r=i[1])&&t.push(new En(r,l,o,a,h)),(r=i[0])&&t.push(new En(r,s,o,l,h))}return this}function oT(e){var t=[],n=[],i;for(this._root&&t.push(new En(this._root,this._x0,this._y0,this._x1,this._y1));i=t.pop();){var r=i.node;if(r.length){var s,o=i.x0,a=i.y0,c=i.x1,l=i.y1,h=(o+c)/2,u=(a+l)/2;(s=r[0])&&t.push(new En(s,o,a,h,u)),(s=r[1])&&t.push(new En(s,h,a,c,u)),(s=r[2])&&t.push(new En(s,o,u,h,l)),(s=r[3])&&t.push(new En(s,h,u,c,l))}n.push(i)}for(;i=n.pop();)e(i.node,i.x0,i.y0,i.x1,i.y1);return this}function aT(e){return e[0]}function cT(e){return arguments.length?(this._x=e,this):this._x}function lT(e){return e[1]}function hT(e){return arguments.length?(this._y=e,this):this._y}function Td(e,t,n){var i=new Ad(t??aT,n??lT,NaN,NaN,NaN,NaN);return e==null?i:i.addAll(e)}function Ad(e,t,n,i,r,s){this._x=e,this._y=t,this._x0=n,this._y0=i,this._x1=r,this._y1=s,this._root=void 0}function k0(e){for(var t={data:e.data},n=t;e=e.next;)n=n.next={data:e.data};return t}var Tn=Td.prototype=Ad.prototype;Tn.copy=function(){var e=new Ad(this._x,this._y,this._x0,this._y0,this._x1,this._y1),t=this._root,n,i;if(!t)return e;if(!t.length)return e._root=k0(t),e;for(n=[{source:t,target:e._root=new Array(4)}];t=n.pop();)for(var r=0;r<4;++r)(i=t.source[r])&&(i.length?n.push({source:i,target:t.target[r]=new Array(4)}):t.target[r]=k0(i));return e};Tn.add=YE;Tn.addAll=ZE;Tn.cover=KE;Tn.data=JE;Tn.extent=QE;Tn.find=tT;Tn.remove=eT;Tn.removeAll=nT;Tn.root=iT;Tn.size=rT;Tn.visit=sT;Tn.visitAfter=oT;Tn.x=cT;Tn.y=hT;function z0(e){let t=+this._x.call(null,e),n=+this._y.call(null,e),i=+this._z.call(null,e);return G0(this.cover(t,n,i),t,n,i,e)}function G0(e,t,n,i,r){if(isNaN(t)||isNaN(n)||isNaN(i))return e;var s,o=e._root,a={data:r},c=e._x0,l=e._y0,h=e._z0,u=e._x1,d=e._y1,f=e._z1,p,_,g,m,y,x,b,S,w,v,M;if(!o)return e._root=a,e;for(;o.length;)if((b=t>=(p=(c+u)/2))?c=p:u=p,(S=n>=(_=(l+d)/2))?l=_:d=_,(w=i>=(g=(h+f)/2))?h=g:f=g,s=o,!(o=o[v=w<<2|S<<1|b]))return s[v]=a,e;if(m=+e._x.call(null,o.data),y=+e._y.call(null,o.data),x=+e._z.call(null,o.data),t===m&&n===y&&i===x)return a.next=o,s?s[v]=a:e._root=a,e;do s=s?s[v]=new Array(8):e._root=new Array(8),(b=t>=(p=(c+u)/2))?c=p:u=p,(S=n>=(_=(l+d)/2))?l=_:d=_,(w=i>=(g=(h+f)/2))?h=g:f=g;while((v=w<<2|S<<1|b)===(M=(x>=g)<<2|(y>=_)<<1|m>=p));return s[M]=o,s[v]=a,e}function V0(e){Array.isArray(e)||(e=Array.from(e));let t=e.length,n=new Float64Array(t),i=new Float64Array(t),r=new Float64Array(t),s=1/0,o=1/0,a=1/0,c=-1/0,l=-1/0,h=-1/0;for(let u=0,d,f,p,_;u<t;++u)isNaN(f=+this._x.call(null,d=e[u]))||isNaN(p=+this._y.call(null,d))||isNaN(_=+this._z.call(null,d))||(n[u]=f,i[u]=p,r[u]=_,f<s&&(s=f),f>c&&(c=f),p<o&&(o=p),p>l&&(l=p),_<a&&(a=_),_>h&&(h=_));if(s>c||o>l||a>h)return this;this.cover(s,o,a).cover(c,l,h);for(let u=0;u<t;++u)G0(this,n[u],i[u],r[u],e[u]);return this}function H0(e,t,n){if(isNaN(e=+e)||isNaN(t=+t)||isNaN(n=+n))return this;var i=this._x0,r=this._y0,s=this._z0,o=this._x1,a=this._y1,c=this._z1;if(isNaN(i))o=(i=Math.floor(e))+1,a=(r=Math.floor(t))+1,c=(s=Math.floor(n))+1;else{for(var l=o-i||1,h=this._root,u,d;i>e||e>=o||r>t||t>=a||s>n||n>=c;)switch(d=(n<s)<<2|(t<r)<<1|e<i,u=new Array(8),u[d]=h,h=u,l*=2,d){case 0:o=i+l,a=r+l,c=s+l;break;case 1:i=o-l,a=r+l,c=s+l;break;case 2:o=i+l,r=a-l,c=s+l;break;case 3:i=o-l,r=a-l,c=s+l;break;case 4:o=i+l,a=r+l,s=c-l;break;case 5:i=o-l,a=r+l,s=c-l;break;case 6:o=i+l,r=a-l,s=c-l;break;case 7:i=o-l,r=a-l,s=c-l;break}this._root&&this._root.length&&(this._root=h)}return this._x0=i,this._y0=r,this._z0=s,this._x1=o,this._y1=a,this._z1=c,this}function W0(){var e=[];return this.visit(function(t){if(!t.length)do e.push(t.data);while(t=t.next)}),e}function $0(e){return arguments.length?this.cover(+e[0][0],+e[0][1],+e[0][2]).cover(+e[1][0],+e[1][1],+e[1][2]):isNaN(this._x0)?void 0:[[this._x0,this._y0,this._z0],[this._x1,this._y1,this._z1]]}function ye(e,t,n,i,r,s,o){this.node=e,this.x0=t,this.y0=n,this.z0=i,this.x1=r,this.y1=s,this.z1=o}function j0(e,t,n,i){var r,s=this._x0,o=this._y0,a=this._z0,c,l,h,u,d,f,p=this._x1,_=this._y1,g=this._z1,m=[],y=this._root,x,b;for(y&&m.push(new ye(y,s,o,a,p,_,g)),i==null?i=1/0:(s=e-i,o=t-i,a=n-i,p=e+i,_=t+i,g=n+i,i*=i);x=m.pop();)if(!(!(y=x.node)||(c=x.x0)>p||(l=x.y0)>_||(h=x.z0)>g||(u=x.x1)<s||(d=x.y1)<o||(f=x.z1)<a))if(y.length){var S=(c+u)/2,w=(l+d)/2,v=(h+f)/2;m.push(new ye(y[7],S,w,v,u,d,f),new ye(y[6],c,w,v,S,d,f),new ye(y[5],S,l,v,u,w,f),new ye(y[4],c,l,v,S,w,f),new ye(y[3],S,w,h,u,d,v),new ye(y[2],c,w,h,S,d,v),new ye(y[1],S,l,h,u,w,v),new ye(y[0],c,l,h,S,w,v)),(b=(n>=v)<<2|(t>=w)<<1|e>=S)&&(x=m[m.length-1],m[m.length-1]=m[m.length-1-b],m[m.length-1-b]=x)}else{var M=e-+this._x.call(null,y.data),U=t-+this._y.call(null,y.data),P=n-+this._z.call(null,y.data),k=M*M+U*U+P*P;if(k<i){var C=Math.sqrt(i=k);s=e-C,o=t-C,a=n-C,p=e+C,_=t+C,g=n+C,r=y.data}}return r}var uT=(e,t,n,i,r,s)=>Math.sqrt((e-i)**2+(t-r)**2+(n-s)**2);function q0(e,t,n,i){let r=[],s=e-i,o=t-i,a=n-i,c=e+i,l=t+i,h=n+i;return this.visit((u,d,f,p,_,g,m)=>{if(!u.length)do{let y=u.data;uT(e,t,n,this._x(y),this._y(y),this._z(y))<=i&&r.push(y)}while(u=u.next);return d>c||f>l||p>h||_<s||g<o||m<a}),r}function X0(e){if(isNaN(d=+this._x.call(null,e))||isNaN(f=+this._y.call(null,e))||isNaN(p=+this._z.call(null,e)))return this;var t,n=this._root,i,r,s,o=this._x0,a=this._y0,c=this._z0,l=this._x1,h=this._y1,u=this._z1,d,f,p,_,g,m,y,x,b,S,w;if(!n)return this;if(n.length)for(;;){if((y=d>=(_=(o+l)/2))?o=_:l=_,(x=f>=(g=(a+h)/2))?a=g:h=g,(b=p>=(m=(c+u)/2))?c=m:u=m,t=n,!(n=n[S=b<<2|x<<1|y]))return this;if(!n.length)break;(t[S+1&7]||t[S+2&7]||t[S+3&7]||t[S+4&7]||t[S+5&7]||t[S+6&7]||t[S+7&7])&&(i=t,w=S)}for(;n.data!==e;)if(r=n,!(n=n.next))return this;return(s=n.next)&&delete n.next,r?(s?r.next=s:delete r.next,this):t?(s?t[S]=s:delete t[S],(n=t[0]||t[1]||t[2]||t[3]||t[4]||t[5]||t[6]||t[7])&&n===(t[7]||t[6]||t[5]||t[4]||t[3]||t[2]||t[1]||t[0])&&!n.length&&(i?i[w]=n:this._root=n),this):(this._root=s,this)}function Y0(e){for(var t=0,n=e.length;t<n;++t)this.remove(e[t]);return this}function Z0(){return this._root}function K0(){var e=0;return this.visit(function(t){if(!t.length)do++e;while(t=t.next)}),e}function J0(e){var t=[],n,i=this._root,r,s,o,a,c,l,h;for(i&&t.push(new ye(i,this._x0,this._y0,this._z0,this._x1,this._y1,this._z1));n=t.pop();)if(!e(i=n.node,s=n.x0,o=n.y0,a=n.z0,c=n.x1,l=n.y1,h=n.z1)&&i.length){var u=(s+c)/2,d=(o+l)/2,f=(a+h)/2;(r=i[7])&&t.push(new ye(r,u,d,f,c,l,h)),(r=i[6])&&t.push(new ye(r,s,d,f,u,l,h)),(r=i[5])&&t.push(new ye(r,u,o,f,c,d,h)),(r=i[4])&&t.push(new ye(r,s,o,f,u,d,h)),(r=i[3])&&t.push(new ye(r,u,d,a,c,l,f)),(r=i[2])&&t.push(new ye(r,s,d,a,u,l,f)),(r=i[1])&&t.push(new ye(r,u,o,a,c,d,f)),(r=i[0])&&t.push(new ye(r,s,o,a,u,d,f))}return this}function Q0(e){var t=[],n=[],i;for(this._root&&t.push(new ye(this._root,this._x0,this._y0,this._z0,this._x1,this._y1,this._z1));i=t.pop();){var r=i.node;if(r.length){var s,o=i.x0,a=i.y0,c=i.z0,l=i.x1,h=i.y1,u=i.z1,d=(o+l)/2,f=(a+h)/2,p=(c+u)/2;(s=r[0])&&t.push(new ye(s,o,a,c,d,f,p)),(s=r[1])&&t.push(new ye(s,d,a,c,l,f,p)),(s=r[2])&&t.push(new ye(s,o,f,c,d,h,p)),(s=r[3])&&t.push(new ye(s,d,f,c,l,h,p)),(s=r[4])&&t.push(new ye(s,o,a,p,d,f,u)),(s=r[5])&&t.push(new ye(s,d,a,p,l,f,u)),(s=r[6])&&t.push(new ye(s,o,f,p,d,h,u)),(s=r[7])&&t.push(new ye(s,d,f,p,l,h,u))}n.push(i)}for(;i=n.pop();)e(i.node,i.x0,i.y0,i.z0,i.x1,i.y1,i.z1);return this}function t_(e){return e[0]}function e_(e){return arguments.length?(this._x=e,this):this._x}function n_(e){return e[1]}function i_(e){return arguments.length?(this._y=e,this):this._y}function r_(e){return e[2]}function s_(e){return arguments.length?(this._z=e,this):this._z}function Na(e,t,n,i){var r=new Cd(t??t_,n??n_,i??r_,NaN,NaN,NaN,NaN,NaN,NaN);return e==null?r:r.addAll(e)}function Cd(e,t,n,i,r,s,o,a,c){this._x=e,this._y=t,this._z=n,this._x0=i,this._y0=r,this._z0=s,this._x1=o,this._y1=a,this._z1=c,this._root=void 0}function o_(e){for(var t={data:e.data},n=t;e=e.next;)n=n.next={data:e.data};return t}var sn=Na.prototype=Cd.prototype;sn.copy=function(){var e=new Cd(this._x,this._y,this._z,this._x0,this._y0,this._z0,this._x1,this._y1,this._z1),t=this._root,n,i;if(!t)return e;if(!t.length)return e._root=o_(t),e;for(n=[{source:t,target:e._root=new Array(8)}];t=n.pop();)for(var r=0;r<8;++r)(i=t.source[r])&&(i.length?n.push({source:i,target:t.target[r]=new Array(8)}):t.target[r]=o_(i));return e};sn.add=z0;sn.addAll=V0;sn.cover=H0;sn.data=W0;sn.extent=$0;sn.find=j0;sn.findAllWithinRadius=q0;sn.remove=X0;sn.removeAll=Y0;sn.root=Z0;sn.size=K0;sn.visit=J0;sn.visitAfter=Q0;sn.x=e_;sn.y=i_;sn.z=s_;function we(e){return function(){return e}}function _i(e){return(e()-.5)*1e-6}function fT(e){return e.index}function a_(e,t){var n=e.get(t);if(!n)throw new Error("node not found: "+t);return n}function Oa(e){var t=fT,n=d,i,r=we(30),s,o,a,c,l,h,u=1;e==null&&(e=[]);function d(m){return 1/Math.min(c[m.source.index],c[m.target.index])}function f(m){for(var y=0,x=e.length;y<u;++y)for(var b=0,S,w,v,M=0,U=0,P=0,k,C;b<x;++b)S=e[b],w=S.source,v=S.target,M=v.x+v.vx-w.x-w.vx||_i(h),a>1&&(U=v.y+v.vy-w.y-w.vy||_i(h)),a>2&&(P=v.z+v.vz-w.z-w.vz||_i(h)),k=Math.sqrt(M*M+U*U+P*P),k=(k-s[b])/k*m*i[b],M*=k,U*=k,P*=k,v.vx-=M*(C=l[b]),a>1&&(v.vy-=U*C),a>2&&(v.vz-=P*C),w.vx+=M*(C=1-C),a>1&&(w.vy+=U*C),a>2&&(w.vz+=P*C)}function p(){if(o){var m,y=o.length,x=e.length,b=new Map(o.map((w,v)=>[t(w,v,o),w])),S;for(m=0,c=new Array(y);m<x;++m)S=e[m],S.index=m,typeof S.source!="object"&&(S.source=a_(b,S.source)),typeof S.target!="object"&&(S.target=a_(b,S.target)),c[S.source.index]=(c[S.source.index]||0)+1,c[S.target.index]=(c[S.target.index]||0)+1;for(m=0,l=new Array(x);m<x;++m)S=e[m],l[m]=c[S.source.index]/(c[S.source.index]+c[S.target.index]);i=new Array(x),_(),s=new Array(x),g()}}function _(){if(o)for(var m=0,y=e.length;m<y;++m)i[m]=+n(e[m],m,e)}function g(){if(o)for(var m=0,y=e.length;m<y;++m)s[m]=+r(e[m],m,e)}return f.initialize=function(m,...y){o=m,h=y.find(x=>typeof x=="function")||Math.random,a=y.find(x=>[1,2,3].includes(x))||2,p()},f.links=function(m){return arguments.length?(e=m,p(),f):e},f.id=function(m){return arguments.length?(t=m,f):t},f.iterations=function(m){return arguments.length?(u=+m,f):u},f.strength=function(m){return arguments.length?(n=typeof m=="function"?m:we(+m),_(),f):n},f.distance=function(m){return arguments.length?(r=typeof m=="function"?m:we(+m),g(),f):r},f}var dT={value:()=>{}};function Rd(){for(var e=0,t=arguments.length,n={},i;e<t;++e){if(!(i=arguments[e]+"")||i in n||/[\s.]/.test(i))throw new Error("illegal type: "+i);n[i]=[]}return new Lh(n)}function Lh(e){this._=e}function pT(e,t){return e.trim().split(/^|\s+/).map(function(n){var i="",r=n.indexOf(".");if(r>=0&&(i=n.slice(r+1),n=n.slice(0,r)),n&&!t.hasOwnProperty(n))throw new Error("unknown type: "+n);return{type:n,name:i}})}Lh.prototype=Rd.prototype={constructor:Lh,on:function(e,t){var n=this._,i=pT(e+"",n),r,s=-1,o=i.length;if(arguments.length<2){for(;++s<o;)if((r=(e=i[s]).type)&&(r=mT(n[r],e.name)))return r;return}if(t!=null&&typeof t!="function")throw new Error("invalid callback: "+t);for(;++s<o;)if(r=(e=i[s]).type)n[r]=c_(n[r],e.name,t);else if(t==null)for(r in n)n[r]=c_(n[r],e.name,null);return this},copy:function(){var e={},t=this._;for(var n in t)e[n]=t[n].slice();return new Lh(e)},call:function(e,t){if((r=arguments.length-2)>0)for(var n=new Array(r),i=0,r,s;i<r;++i)n[i]=arguments[i+2];if(!this._.hasOwnProperty(e))throw new Error("unknown type: "+e);for(s=this._[e],i=0,r=s.length;i<r;++i)s[i].value.apply(t,n)},apply:function(e,t,n){if(!this._.hasOwnProperty(e))throw new Error("unknown type: "+e);for(var i=this._[e],r=0,s=i.length;r<s;++r)i[r].value.apply(t,n)}};function mT(e,t){for(var n=0,i=e.length,r;n<i;++n)if((r=e[n]).name===t)return r.value}function c_(e,t,n){for(var i=0,r=e.length;i<r;++i)if(e[i].name===t){e[i]=dT,e=e.slice(0,i).concat(e.slice(i+1));break}return n!=null&&e.push({name:t,value:n}),e}var go=0,Ua=0,Fa=0,h_=1e3,Dh,ka,Nh=0,us=0,Oh=0,Ba=typeof performance=="object"&&performance.now?performance:Date,u_=typeof window=="object"&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(e){setTimeout(e,17)};function f_(){return us||(u_(gT),us=Ba.now()+Oh)}function gT(){us=0}function Pd(){this._call=this._time=this._next=null}Pd.prototype=Ld.prototype={constructor:Pd,restart:function(e,t,n){if(typeof e!="function")throw new TypeError("callback is not a function");n=(n==null?f_():+n)+(t==null?0:+t),!this._next&&ka!==this&&(ka?ka._next=this:Dh=this,ka=this),this._call=e,this._time=n,Id()},stop:function(){this._call&&(this._call=null,this._time=1/0,Id())}};function Ld(e,t,n){var i=new Pd;return i.restart(e,t,n),i}function _T(){f_(),++go;for(var e=Dh,t;e;)(t=us-e._time)>=0&&e._call.call(void 0,t),e=e._next;--go}function l_(){us=(Nh=Ba.now())+Oh,go=Ua=0;try{_T()}finally{go=0,vT(),us=0}}function yT(){var e=Ba.now(),t=e-Nh;t>h_&&(Oh-=t,Nh=e)}function vT(){for(var e,t=Dh,n,i=1/0;t;)t._call?(i>t._time&&(i=t._time),e=t,t=t._next):(n=t._next,t._next=null,t=e?e._next=n:Dh=n);ka=e,Id(i)}function Id(e){if(!go){Ua&&(Ua=clearTimeout(Ua));var t=e-us;t>24?(e<1/0&&(Ua=setTimeout(l_,Math.ceil(e-Ba.now()-Oh)+1)),Fa&&(Fa=clearInterval(Fa))):(Fa||(Nh=Ba.now(),Fa=setInterval(yT,h_)),go=1,u_(l_))}}function d_(){let e=1;return()=>(e=(1664525*e+1013904223)%4294967296)/4294967296}var p_=3;function Fh(e){return e.x}function Dd(e){return e.y}function m_(e){return e.z}var bT=10,xT=Math.PI*(3-Math.sqrt(5)),MT=Math.PI*20/(9+Math.sqrt(221));function za(e,t){t=t||2;var n=Math.min(p_,Math.max(1,Math.round(t))),i,r=1,s=.001,o=1-Math.pow(s,1/300),a=0,c=.6,l=new Map,h=Ld(f),u=Rd("tick","end"),d=d_();e==null&&(e=[]);function f(){p(),u.call("tick",i),r<s&&(h.stop(),u.call("end",i))}function p(m){var y,x=e.length,b;m===void 0&&(m=1);for(var S=0;S<m;++S)for(r+=(a-r)*o,l.forEach(function(w){w(r)}),y=0;y<x;++y)b=e[y],b.fx==null?b.x+=b.vx*=c:(b.x=b.fx,b.vx=0),n>1&&(b.fy==null?b.y+=b.vy*=c:(b.y=b.fy,b.vy=0)),n>2&&(b.fz==null?b.z+=b.vz*=c:(b.z=b.fz,b.vz=0));return i}function _(){for(var m=0,y=e.length,x;m<y;++m){if(x=e[m],x.index=m,x.fx!=null&&(x.x=x.fx),x.fy!=null&&(x.y=x.fy),x.fz!=null&&(x.z=x.fz),isNaN(x.x)||n>1&&isNaN(x.y)||n>2&&isNaN(x.z)){var b=bT*(n>2?Math.cbrt(.5+m):n>1?Math.sqrt(.5+m):m),S=m*xT,w=m*MT;n===1?x.x=b:n===2?(x.x=b*Math.cos(S),x.y=b*Math.sin(S)):(x.x=b*Math.sin(S)*Math.cos(w),x.y=b*Math.cos(S),x.z=b*Math.sin(S)*Math.sin(w))}(isNaN(x.vx)||n>1&&isNaN(x.vy)||n>2&&isNaN(x.vz))&&(x.vx=0,n>1&&(x.vy=0),n>2&&(x.vz=0))}}function g(m){return m.initialize&&m.initialize(e,d,n),m}return _(),i={tick:p,restart:function(){return h.restart(f),i},stop:function(){return h.stop(),i},numDimensions:function(m){return arguments.length?(n=Math.min(p_,Math.max(1,Math.round(m))),l.forEach(g),i):n},nodes:function(m){return arguments.length?(e=m,_(),l.forEach(g),i):e},alpha:function(m){return arguments.length?(r=+m,i):r},alphaMin:function(m){return arguments.length?(s=+m,i):s},alphaDecay:function(m){return arguments.length?(o=+m,i):+o},alphaTarget:function(m){return arguments.length?(a=+m,i):a},velocityDecay:function(m){return arguments.length?(c=1-m,i):1-c},randomSource:function(m){return arguments.length?(d=m,l.forEach(g),i):d},force:function(m,y){return arguments.length>1?(y==null?l.delete(m):l.set(m,g(y)),i):l.get(m)},find:function(){var m=Array.prototype.slice.call(arguments),y=m.shift()||0,x=(n>1?m.shift():null)||0,b=(n>2?m.shift():null)||0,S=m.shift()||1/0,w=0,v=e.length,M,U,P,k,C,N;for(S*=S,w=0;w<v;++w)C=e[w],M=y-C.x,U=x-(C.y||0),P=b-(C.z||0),k=M*M+U*U+P*P,k<S&&(N=C,S=k);return N},on:function(m,y){return arguments.length>1?(u.on(m,y),i):u.on(m)}}}function Ga(){var e,t,n,i,r,s=we(-30),o,a=1,c=1/0,l=.81;function h(p){var _,g=e.length,m=(t===1?Da(e,Fh):t===2?Td(e,Fh,Dd):t===3?Na(e,Fh,Dd,m_):null).visitAfter(d);for(r=p,_=0;_<g;++_)n=e[_],m.visit(f)}function u(){if(e){var p,_=e.length,g;for(o=new Array(_),p=0;p<_;++p)g=e[p],o[g.index]=+s(g,p,e)}}function d(p){var _=0,g,m,y=0,x,b,S,w,v=p.length;if(v){for(x=b=S=w=0;w<v;++w)(g=p[w])&&(m=Math.abs(g.value))&&(_+=g.value,y+=m,x+=m*(g.x||0),b+=m*(g.y||0),S+=m*(g.z||0));_*=Math.sqrt(4/v),p.x=x/y,t>1&&(p.y=b/y),t>2&&(p.z=S/y)}else{g=p,g.x=g.data.x,t>1&&(g.y=g.data.y),t>2&&(g.z=g.data.z);do _+=o[g.data.index];while(g=g.next)}p.value=_}function f(p,_,g,m,y){if(!p.value)return!0;var x=[g,m,y][t-1],b=p.x-n.x,S=t>1?p.y-n.y:0,w=t>2?p.z-n.z:0,v=x-_,M=b*b+S*S+w*w;if(v*v/l<M)return M<c&&(b===0&&(b=_i(i),M+=b*b),t>1&&S===0&&(S=_i(i),M+=S*S),t>2&&w===0&&(w=_i(i),M+=w*w),M<a&&(M=Math.sqrt(a*M)),n.vx+=b*p.value*r/M,t>1&&(n.vy+=S*p.value*r/M),t>2&&(n.vz+=w*p.value*r/M)),!0;if(p.length||M>=c)return;(p.data!==n||p.next)&&(b===0&&(b=_i(i),M+=b*b),t>1&&S===0&&(S=_i(i),M+=S*S),t>2&&w===0&&(w=_i(i),M+=w*w),M<a&&(M=Math.sqrt(a*M)));do p.data!==n&&(v=o[p.data.index]*r/M,n.vx+=b*v,t>1&&(n.vy+=S*v),t>2&&(n.vz+=w*v));while(p=p.next)}return h.initialize=function(p,..._){e=p,i=_.find(g=>typeof g=="function")||Math.random,t=_.find(g=>[1,2,3].includes(g))||2,u()},h.strength=function(p){return arguments.length?(s=typeof p=="function"?p:we(+p),u(),h):s},h.distanceMin=function(p){return arguments.length?(a=p*p,h):Math.sqrt(a)},h.distanceMax=function(p){return arguments.length?(c=p*p,h):Math.sqrt(c)},h.theta=function(p){return arguments.length?(l=p*p,h):Math.sqrt(l)},h}function Nd(e,t,n,i){var r,s,o=we(.1),a,c;typeof e!="function"&&(e=we(+e)),t==null&&(t=0),n==null&&(n=0),i==null&&(i=0);function l(u){for(var d=0,f=r.length;d<f;++d){var p=r[d],_=p.x-t||1e-6,g=(p.y||0)-n||1e-6,m=(p.z||0)-i||1e-6,y=Math.sqrt(_*_+g*g+m*m),x=(c[d]-y)*a[d]*u/y;p.vx+=_*x,s>1&&(p.vy+=g*x),s>2&&(p.vz+=m*x)}}function h(){if(r){var u,d=r.length;for(a=new Array(d),c=new Array(d),u=0;u<d;++u)c[u]=+e(r[u],u,r),a[u]=isNaN(c[u])?0:+o(r[u],u,r)}}return l.initialize=function(u,...d){r=u,s=d.find(f=>[1,2,3].includes(f))||2,h()},l.strength=function(u){return arguments.length?(o=typeof u=="function"?u:we(+u),h(),l):o},l.radius=function(u){return arguments.length?(e=typeof u=="function"?u:we(+u),h(),l):e},l.x=function(u){return arguments.length?(t=+u,l):t},l.y=function(u){return arguments.length?(n=+u,l):n},l.z=function(u){return arguments.length?(i=+u,l):i},l}function Od(e){var t=we(.1),n,i,r;typeof e!="function"&&(e=we(e==null?0:+e));function s(a){for(var c=0,l=n.length,h;c<l;++c)h=n[c],h.vx+=(r[c]-h.x)*i[c]*a}function o(){if(n){var a,c=n.length;for(i=new Array(c),r=new Array(c),a=0;a<c;++a)i[a]=isNaN(r[a]=+e(n[a],a,n))?0:+t(n[a],a,n)}}return s.initialize=function(a){n=a,o()},s.strength=function(a){return arguments.length?(t=typeof a=="function"?a:we(+a),o(),s):t},s.x=function(a){return arguments.length?(e=typeof a=="function"?a:we(+a),o(),s):e},s}function Fd(e){var t=we(.1),n,i,r;typeof e!="function"&&(e=we(e==null?0:+e));function s(a){for(var c=0,l=n.length,h;c<l;++c)h=n[c],h.vy+=(r[c]-h.y)*i[c]*a}function o(){if(n){var a,c=n.length;for(i=new Array(c),r=new Array(c),a=0;a<c;++a)i[a]=isNaN(r[a]=+e(n[a],a,n))?0:+t(n[a],a,n)}}return s.initialize=function(a){n=a,o()},s.strength=function(a){return arguments.length?(t=typeof a=="function"?a:we(+a),o(),s):t},s.y=function(a){return arguments.length?(e=typeof a=="function"?a:we(+a),o(),s):e},s}function Ud(e){var t=we(.1),n,i,r;typeof e!="function"&&(e=we(e==null?0:+e));function s(a){for(var c=0,l=n.length,h;c<l;++c)h=n[c],h.vz+=(r[c]-h.z)*i[c]*a}function o(){if(n){var a,c=n.length;for(i=new Array(c),r=new Array(c),a=0;a<c;++a)i[a]=isNaN(r[a]=+e(n[a],a,n))?0:+t(n[a],a,n)}}return s.initialize=function(a){n=a,o()},s.strength=function(a){return arguments.length?(t=typeof a=="function"?a:we(+a),o(),s):t},s.z=function(a){return arguments.length?(e=typeof a=="function"?a:we(+a),o(),s):e},s}function kd(e){wT(e);let t=ST(e);return e.on=t.on,e.off=t.off,e.fire=t.fire,e}function ST(e){let t=Object.create(null);return{on:function(n,i,r){if(typeof i!="function")throw new Error("callback is expected to be a function");let s=t[n];return s||(s=t[n]=[]),s.push({callback:i,ctx:r}),e},off:function(n,i){if(typeof n>"u")return t=Object.create(null),e;if(t[n])if(typeof i!="function")delete t[n];else{let o=t[n];for(let a=0;a<o.length;++a)o[a].callback===i&&o.splice(a,1)}return e},fire:function(n){let i=t[n];if(!i)return e;let r;arguments.length>1&&(r=Array.prototype.slice.call(arguments,1));for(let s=0;s<i.length;++s){let o=i[s];o.callback.apply(o.ctx,r)}return e}}}function wT(e){if(!e)throw new Error("Eventify cannot use falsy object as events subject");let t=["on","fire","off"];for(let n=0;n<t.length;++n)if(e.hasOwnProperty(t[n]))throw new Error("Subject cannot be eventified, since it already has property '"+t[n]+"'")}var y_=ET;function ET(e){if(e=e||{},"uniqueLinkId"in e&&(console.warn("ngraph.graph: Starting from version 0.14 `uniqueLinkId` is deprecated.\nUse `multigraph` option instead\n",`
`,`Note: there is also change in default behavior: From now on each graph
is considered to be not a multigraph by default (each edge is unique).`),e.multigraph=e.uniqueLinkId),e.multigraph===void 0&&(e.multigraph=!1),typeof Map!="function")throw new Error("ngraph.graph requires `Map` to be defined. Please polyfill it before using ngraph");var t=new Map,n=new Map,i={},r=0,s=e.multigraph?b:x,o=[],a=D,c=D,l=D,h=D,u={version:20,addNode:_,addLink:y,removeLink:M,removeNode:m,getNode:g,getNodeCount:S,getLinkCount:w,getEdgeCount:w,getLinksCount:w,getNodesCount:S,getLinks:v,forEachNode:Z,forEachLinkedNode:T,forEachLink:N,beginUpdate:l,endUpdate:h,clear:C,hasLink:P,hasNode:g,getLink:P,getLinkById:k};return kd(u),d(),u;function d(){var $=u.on;u.on=J;function J(){return u.beginUpdate=l=j,u.endUpdate=h=H,a=f,c=p,u.on=$,$.apply(u,arguments)}}function f($,J){o.push({link:$,changeType:J})}function p($,J){o.push({node:$,changeType:J})}function _($,J){if($===void 0)throw new Error("Invalid node identifier");l();var lt=g($);return lt?(lt.data=J,c(lt,"update")):(lt=new TT($,J),c(lt,"add")),t.set($,lt),h(),lt}function g($){return t.get($)}function m($){var J=g($);if(!J)return!1;l();var lt=J.links;return lt&&(lt.forEach(U),J.links=null),t.delete($),c(J,"remove"),h(),!0}function y($,J,lt){l();var K=g($)||_($),ct=g(J)||_(J),at=s($,J,lt),Pt=n.has(at.id);return n.set(at.id,at),g_(K,at),$!==J&&g_(ct,at),a(at,Pt?"update":"add"),h(),at}function x($,J,lt){var K=Uh($,J),ct=n.get(K);return ct?(ct.data=lt,ct):new __($,J,lt,K)}function b($,J,lt){var K=Uh($,J),ct=i.hasOwnProperty(K);if(ct||P($,J)){ct||(i[K]=0);var at="@"+ ++i[K];K=Uh($+at,J+at)}return new __($,J,lt,K)}function S(){return t.size}function w(){return n.size}function v($){var J=g($);return J?J.links:null}function M($,J){return J!==void 0&&($=P($,J)),U($)}function U($){if(!$||!n.get($.id))return!1;l(),n.delete($.id);var J=g($.fromId),lt=g($.toId);return J&&J.links.delete($),lt&&lt.links.delete($),a($,"remove"),h(),!0}function P($,J){if(!($===void 0||J===void 0))return n.get(Uh($,J))}function k($){if($!==void 0)return n.get($)}function C(){l(),Z(function($){m($.id)}),h()}function N($){if(typeof $=="function")for(var J=n.values(),lt=J.next();!lt.done;){if($(lt.value))return!0;lt=J.next()}}function T($,J,lt){var K=g($);if(K&&K.links&&typeof J=="function")return lt?B(K.links,$,J):I(K.links,$,J)}function I($,J,lt){for(var K,ct=$.values(),at=ct.next();!at.done;){var Pt=at.value,_t=Pt.fromId===J?Pt.toId:Pt.fromId;if(K=lt(t.get(_t),Pt),K)return!0;at=ct.next()}}function B($,J,lt){for(var K,ct=$.values(),at=ct.next();!at.done;){var Pt=at.value;if(Pt.fromId===J&&(K=lt(t.get(Pt.toId),Pt),K))return!0;at=ct.next()}}function D(){}function j(){r+=1}function H(){r-=1,r===0&&o.length>0&&(u.fire("changed",o),o.length=0)}function Z($){if(typeof $!="function")throw new Error("Function is expected to iterate over graph nodes. You passed "+$);for(var J=t.values(),lt=J.next();!lt.done;){if($(lt.value))return!0;lt=J.next()}}}function TT(e,t){this.id=e,this.links=null,this.data=t}function g_(e,t){e.links?e.links.add(t):e.links=new Set([t])}function __(e,t,n,i){this.fromId=e,this.toId=t,this.data=n,this.id=i}function Uh(e,t){return e.toString()+"\u{1F449} "+t.toString()}var pv=tx(K_(),1);function rA(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}var Ha=rA;var sA=typeof global=="object"&&global&&global.Object===Object&&global,J_=sA;var oA=typeof self=="object"&&self&&self.Object===Object&&self,aA=J_||oA||Function("return this")(),Bh=aA;var cA=function(){return Bh.Date.now()},zh=cA;var lA=/\s/;function hA(e){for(var t=e.length;t--&&lA.test(e.charAt(t)););return t}var Q_=hA;var uA=/^\s+/;function fA(e){return e&&e.slice(0,Q_(e)+1).replace(uA,"")}var ty=fA;var dA=Bh.Symbol,_o=dA;var ey=Object.prototype,pA=ey.hasOwnProperty,mA=ey.toString,Wa=_o?_o.toStringTag:void 0;function gA(e){var t=pA.call(e,Wa),n=e[Wa];try{e[Wa]=void 0;var i=!0}catch{}var r=mA.call(e);return i&&(t?e[Wa]=n:delete e[Wa]),r}var ny=gA;var _A=Object.prototype,yA=_A.toString;function vA(e){return yA.call(e)}var iy=vA;var bA="[object Null]",xA="[object Undefined]",ry=_o?_o.toStringTag:void 0;function MA(e){return e==null?e===void 0?xA:bA:ry&&ry in Object(e)?ny(e):iy(e)}var sy=MA;function SA(e){return e!=null&&typeof e=="object"}var oy=SA;var wA="[object Symbol]";function EA(e){return typeof e=="symbol"||oy(e)&&sy(e)==wA}var ay=EA;var cy=NaN,TA=/^[-+]0x[0-9a-f]+$/i,AA=/^0b[01]+$/i,CA=/^0o[0-7]+$/i,RA=parseInt;function PA(e){if(typeof e=="number")return e;if(ay(e))return cy;if(Ha(e)){var t=typeof e.valueOf=="function"?e.valueOf():e;e=Ha(t)?t+"":t}if(typeof e!="string")return e===0?e:+e;e=ty(e);var n=AA.test(e);return n||CA.test(e)?RA(e.slice(2),n?2:8):TA.test(e)?cy:+e}var Zd=PA;var IA="Expected a function",LA=Math.max,DA=Math.min;function NA(e,t,n){var i,r,s,o,a,c,l=0,h=!1,u=!1,d=!0;if(typeof e!="function")throw new TypeError(IA);t=Zd(t)||0,Ha(n)&&(h=!!n.leading,u="maxWait"in n,s=u?LA(Zd(n.maxWait)||0,t):s,d="trailing"in n?!!n.trailing:d);function f(w){var v=i,M=r;return i=r=void 0,l=w,o=e.apply(M,v),o}function p(w){return l=w,a=setTimeout(m,t),h?f(w):o}function _(w){var v=w-c,M=w-l,U=t-v;return u?DA(U,s-M):U}function g(w){var v=w-c,M=w-l;return c===void 0||v>=t||v<0||u&&M>=s}function m(){var w=zh();if(g(w))return y(w);a=setTimeout(m,_(w))}function y(w){return a=void 0,d&&i?f(w):(i=r=void 0,o)}function x(){a!==void 0&&clearTimeout(a),l=0,i=c=r=a=void 0}function b(){return a===void 0?o:y(zh())}function S(){var w=zh(),v=g(w);if(i=arguments,r=this,c=w,v){if(a===void 0)return p(c);if(u)return clearTimeout(a),a=setTimeout(m,t),f(c)}return a===void 0&&(a=setTimeout(m,t)),o}return S.cancel=x,S.flush=b,S}var ly=NA;function hy(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,i=Array(t);n<t;n++)i[n]=e[n];return i}function OA(e){if(Array.isArray(e))return e}function FA(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function UA(e,t,n){return Object.defineProperty(e,"prototype",{writable:!1}),e}function kA(e,t){var n=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(n!=null){var i,r,s,o,a=[],c=!0,l=!1;try{if(s=(n=n.call(e)).next,t!==0)for(;!(c=(i=s.call(n)).done)&&(a.push(i.value),a.length!==t);c=!0);}catch(h){l=!0,r=h}finally{try{if(!c&&n.return!=null&&(o=n.return(),Object(o)!==o))return}finally{if(l)throw r}}return a}}function BA(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function zA(e,t){return OA(e)||kA(e,t)||GA(e,t)||BA()}function GA(e,t){if(e){if(typeof e=="string")return hy(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?hy(e,t):void 0}}var VA=UA(function e(t,n){var i=n.default,r=i===void 0?null:i,s=n.triggerUpdate,o=s===void 0?!0:s,a=n.onChange,c=a===void 0?function(l,h){}:a;FA(this,e),this.name=t,this.defaultVal=r,this.triggerUpdate=o,this.onChange=c});function Ur(e){var t=e.stateInit,n=t===void 0?function(){return{}}:t,i=e.props,r=i===void 0?{}:i,s=e.methods,o=s===void 0?{}:s,a=e.aliases,c=a===void 0?{}:a,l=e.init,h=l===void 0?function(){}:l,u=e.update,d=u===void 0?function(){}:u,f=Object.keys(r).map(function(p){return new VA(p,r[p])});return function p(){for(var _=arguments.length,g=new Array(_),m=0;m<_;m++)g[m]=arguments[m];var y=!!(this instanceof p&&this.constructor),x=y?g.shift():void 0,b=g[0],S=b===void 0?{}:b,w=Object.assign({},n instanceof Function?n(S):n,{initialised:!1}),v={};function M(k){return U(k,S),P(),M}var U=function(C,N){h.call(M,C,w,N),w.initialised=!0},P=ly(function(){w.initialised&&(d.call(M,w,v),v={})},1);return f.forEach(function(k){M[k.name]=C(k);function C(N){var T=N.name,I=N.triggerUpdate,B=I===void 0?!1:I,D=N.onChange,j=D===void 0?function($,J){}:D,H=N.defaultVal,Z=H===void 0?null:H;return function($){var J=w[T];if(!arguments.length)return J;var lt=$===void 0?Z:$;return w[T]=lt,j.call(M,lt,w,J),!v.hasOwnProperty(T)&&(v[T]=J),B&&P(),M}}}),Object.keys(o).forEach(function(k){M[k]=function(){for(var C,N=arguments.length,T=new Array(N),I=0;I<N;I++)T[I]=arguments[I];return(C=o[k]).call.apply(C,[M,w].concat(T))}}),Object.entries(c).forEach(function(k){var C=zA(k,2),N=C[0],T=C[1];return M[N]=M[T]}),M.resetProps=function(){return f.forEach(function(k){M[k.name](k.defaultVal)}),M},M.resetProps(),w._rerender=P,y&&x&&M(x),M}}var te=(function(e){return typeof e=="function"?e:typeof e=="string"?function(t){return t[e]}:function(t){return e}});function $a(e,t){return e==null||t==null?NaN:e<t?-1:e>t?1:e>=t?0:NaN}function HA(e,t){return e==null||t==null?NaN:t<e?-1:t>e?1:t>=e?0:NaN}function fy(e){let t,n,i;e.length!==2?(t=$a,n=(a,c)=>$a(e(a),c),i=(a,c)=>e(a)-c):(t=e===$a||e===HA?e:WA,n=e,i=e);function r(a,c,l=0,h=a.length){if(l<h){if(t(c,c)!==0)return h;do{let u=l+h>>>1;n(a[u],c)<0?l=u+1:h=u}while(l<h)}return l}function s(a,c,l=0,h=a.length){if(l<h){if(t(c,c)!==0)return h;do{let u=l+h>>>1;n(a[u],c)<=0?l=u+1:h=u}while(l<h)}return l}function o(a,c,l=0,h=a.length){let u=r(a,c,l,h-1);return u>l&&i(a[u-1],c)>-i(a[u],c)?u-1:u}return{left:r,center:o,right:s}}function WA(){return 0}function $A(e){return e===null?NaN:+e}var dy=fy($a),jA=dy.right,EU=dy.left,TU=fy($A).center;var AU=py(my),CU=py(qA);function py(e){return function(t,n,i=n){if(!((n=+n)>=0))throw new RangeError("invalid rx");if(!((i=+i)>=0))throw new RangeError("invalid ry");let{data:r,width:s,height:o}=t;if(!((s=Math.floor(s))>=0))throw new RangeError("invalid width");if(!((o=Math.floor(o!==void 0?o:r.length/s))>=0))throw new RangeError("invalid height");if(!s||!o||!n&&!i)return t;let a=n&&e(n),c=i&&e(i),l=r.slice();return a&&c?(yo(a,l,r,s,o),yo(a,r,l,s,o),yo(a,l,r,s,o),vo(c,r,l,s,o),vo(c,l,r,s,o),vo(c,r,l,s,o)):a?(yo(a,r,l,s,o),yo(a,l,r,s,o),yo(a,r,l,s,o)):c&&(vo(c,r,l,s,o),vo(c,l,r,s,o),vo(c,r,l,s,o)),t}}function yo(e,t,n,i,r){for(let s=0,o=i*r;s<o;)e(t,n,s,s+=i,1)}function vo(e,t,n,i,r){for(let s=0,o=i*r;s<i;++s)e(t,n,s,s+o,i)}function qA(e){let t=my(e);return(n,i,r,s,o)=>{r<<=2,s<<=2,o<<=2,t(n,i,r+0,s+0,o),t(n,i,r+1,s+1,o),t(n,i,r+2,s+2,o),t(n,i,r+3,s+3,o)}}function my(e){let t=Math.floor(e);if(t===e)return XA(e);let n=e-t,i=2*e+1;return(r,s,o,a,c)=>{if(!((a-=c)>=o))return;let l=t*s[o],h=c*t,u=h+c;for(let d=o,f=o+h;d<f;d+=c)l+=s[Math.min(a,d)];for(let d=o,f=a;d<=f;d+=c)l+=s[Math.min(a,d+h)],r[d]=(l+n*(s[Math.max(o,d-u)]+s[Math.min(a,d+u)]))/i,l-=s[Math.max(o,d-h)]}}function XA(e){let t=2*e+1;return(n,i,r,s,o)=>{if(!((s-=o)>=r))return;let a=e*i[r],c=o*e;for(let l=r,h=r+c;l<h;l+=o)a+=i[Math.min(s,l)];for(let l=r,h=s;l<=h;l+=o)a+=i[Math.min(s,l+c)],n[l]=a/t,a-=i[Math.max(r,l-c)]}}var ja=class extends Map{constructor(t,n=KA){if(super(),Object.defineProperties(this,{_intern:{value:new Map},_key:{value:n}}),t!=null)for(let[i,r]of t)this.set(i,r)}get(t){return super.get(uy(this,t))}has(t){return super.has(uy(this,t))}set(t,n){return super.set(YA(this,t),n)}delete(t){return super.delete(ZA(this,t))}};function uy({_intern:e,_key:t},n){let i=t(n);return e.has(i)?e.get(i):n}function YA({_intern:e,_key:t},n){let i=t(n);return e.has(i)?e.get(i):(e.set(i,n),n)}function ZA({_intern:e,_key:t},n){let i=t(n);return e.has(i)&&(n=e.get(i),e.delete(i)),n}function KA(e){return e!==null&&typeof e=="object"?e.valueOf():e}var JA=Array.prototype,RU=JA.slice;var PU=Math.sqrt(50),IU=Math.sqrt(10),LU=Math.sqrt(2);function gy(e,t){let n;if(t===void 0)for(let i of e)i!=null&&(n<i||n===void 0&&i>=i)&&(n=i);else{let i=-1;for(let r of e)(r=t(r,++i,e))!=null&&(n<r||n===void 0&&r>=r)&&(n=r)}return n}function _y(e,t){let n;if(t===void 0)for(let i of e)i!=null&&(n>i||n===void 0&&i>=i)&&(n=i);else{let i=-1;for(let r of e)(r=t(r,++i,e))!=null&&(n>r||n===void 0&&r>=r)&&(n=r)}return n}var DU=QA(Math.random);function QA(e){return function(n,i=0,r=n.length){let s=r-(i=+i);for(;s;){let o=e()*s--|0,a=n[s+i];n[s+i]=n[o+i],n[o+i]=a}return n}}function tp(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,i=Array(t);n<t;n++)i[n]=e[n];return i}function t2(e){if(Array.isArray(e))return e}function e2(e){if(Array.isArray(e))return tp(e)}function yy(e,t,n){if(typeof e=="function"?e===t:e.has(t))return arguments.length<3?t:n;throw new TypeError("Private element is not present on this object")}function n2(e,t){if(t.has(e))throw new TypeError("Cannot initialize the same private elements twice on an object")}function i2(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function gn(e,t){return e.get(yy(e,t))}function bo(e,t,n){n2(e,t),t.set(e,n)}function Gh(e,t,n){return e.set(yy(e,t),n),n}function r2(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,d2(i.key),i)}}function s2(e,t,n){return t&&r2(e.prototype,t),Object.defineProperty(e,"prototype",{writable:!1}),e}function o2(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function a2(e,t){var n=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(n!=null){var i,r,s,o,a=[],c=!0,l=!1;try{if(s=(n=n.call(e)).next,t!==0)for(;!(c=(i=s.call(n)).done)&&(a.push(i.value),a.length!==t);c=!0);}catch(h){l=!0,r=h}finally{try{if(!c&&n.return!=null&&(o=n.return(),Object(o)!==o))return}finally{if(l)throw r}}return a}}function c2(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function l2(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function h2(e,t){return t2(e)||a2(e,t)||vy(e,t)||c2()}function u2(e){return e2(e)||o2(e)||vy(e)||l2()}function f2(e,t){if(typeof e!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var i=n.call(e,t);if(typeof i!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}function d2(e){var t=f2(e,"string");return typeof t=="symbol"?t:t+""}function vy(e,t){if(e){if(typeof e=="string")return tp(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?tp(e,t):void 0}}var xo=new WeakMap,qa=new WeakMap,Mo=new WeakMap,Kd=new WeakMap,Jd=new WeakMap,Qd=new WeakMap,by=(function(){function e(){i2(this,e),bo(this,xo,new Map),bo(this,qa,new Map),bo(this,Mo,function(t){return t}),bo(this,Kd,function(){return{}}),bo(this,Jd,function(){}),bo(this,Qd,function(){})}return s2(e,[{key:"getObj",value:function(n){return gn(xo,this).get(gn(Mo,this).call(this,n))}},{key:"getData",value:function(n){return gn(qa,this).get(n)}},{key:"entries",value:function(){return u2(gn(qa,this).entries()).map(function(n){var i=h2(n,2),r=i[0],s=i[1];return[s,r]})}},{key:"id",value:function(n){return Gh(Mo,this,te(n)),this}},{key:"onCreateObj",value:function(n){return Gh(Kd,this,n),this}},{key:"onUpdateObj",value:function(n){return Gh(Jd,this,n),this}},{key:"onRemoveObj",value:function(n){return Gh(Qd,this,n),this}},{key:"digest",value:function(n){var i=this;n.filter(function(s){return!gn(xo,i).has(gn(Mo,i).call(i,s))}).forEach(function(s){var o=gn(Kd,i).call(i,s);gn(xo,i).set(gn(Mo,i).call(i,s),o),gn(qa,i).set(o,s)});var r=new Map(n.map(function(s){return[gn(Mo,i).call(i,s),s]}));return gn(xo,this).forEach(function(s,o){r.has(o)?gn(Jd,i).call(i,s,r.get(o)):(gn(Qd,i).call(i,s,o),gn(xo,i).delete(o),gn(qa,i).delete(s))}),this}},{key:"clear",value:function(){return this.digest([]),this}}])})();function To(e,t,n){e.prototype=t.prototype=n,n.constructor=e}function Za(e,t){var n=Object.create(e.prototype);for(var i in t)n[i]=t[i];return n}function kr(){}var _s=.7,Eo=1/_s,So="\\s*([+-]?\\d+)\\s*",Xa="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",Fi="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",p2=/^#([0-9a-f]{3,8})$/,m2=new RegExp(`^rgb\\(${So},${So},${So}\\)$`),g2=new RegExp(`^rgb\\(${Fi},${Fi},${Fi}\\)$`),_2=new RegExp(`^rgba\\(${So},${So},${So},${Xa}\\)$`),y2=new RegExp(`^rgba\\(${Fi},${Fi},${Fi},${Xa}\\)$`),v2=new RegExp(`^hsl\\(${Xa},${Fi},${Fi}\\)$`),b2=new RegExp(`^hsla\\(${Xa},${Fi},${Fi},${Xa}\\)$`),xy={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};To(kr,jh,{copy(e){return Object.assign(new this.constructor,this,e)},displayable(){return this.rgb().displayable()},hex:My,formatHex:My,formatHex8:x2,formatHsl:M2,formatRgb:Sy,toString:Sy});function My(){return this.rgb().formatHex()}function x2(){return this.rgb().formatHex8()}function M2(){return Ly(this).formatHsl()}function Sy(){return this.rgb().formatRgb()}function jh(e){var t,n;return e=(e+"").trim().toLowerCase(),(t=p2.exec(e))?(n=t[1].length,t=parseInt(t[1],16),n===6?wy(t):n===3?new Je(t>>8&15|t>>4&240,t>>4&15|t&240,(t&15)<<4|t&15,1):n===8?Vh(t>>24&255,t>>16&255,t>>8&255,(t&255)/255):n===4?Vh(t>>12&15|t>>8&240,t>>8&15|t>>4&240,t>>4&15|t&240,((t&15)<<4|t&15)/255):null):(t=m2.exec(e))?new Je(t[1],t[2],t[3],1):(t=g2.exec(e))?new Je(t[1]*255/100,t[2]*255/100,t[3]*255/100,1):(t=_2.exec(e))?Vh(t[1],t[2],t[3],t[4]):(t=y2.exec(e))?Vh(t[1]*255/100,t[2]*255/100,t[3]*255/100,t[4]):(t=v2.exec(e))?Ay(t[1],t[2]/100,t[3]/100,1):(t=b2.exec(e))?Ay(t[1],t[2]/100,t[3]/100,t[4]):xy.hasOwnProperty(e)?wy(xy[e]):e==="transparent"?new Je(NaN,NaN,NaN,0):null}function wy(e){return new Je(e>>16&255,e>>8&255,e&255,1)}function Vh(e,t,n,i){return i<=0&&(e=t=n=NaN),new Je(e,t,n,i)}function op(e){return e instanceof kr||(e=jh(e)),e?(e=e.rgb(),new Je(e.r,e.g,e.b,e.opacity)):new Je}function ys(e,t,n,i){return arguments.length===1?op(e):new Je(e,t,n,i??1)}function Je(e,t,n,i){this.r=+e,this.g=+t,this.b=+n,this.opacity=+i}To(Je,ys,Za(kr,{brighter(e){return e=e==null?Eo:Math.pow(Eo,e),new Je(this.r*e,this.g*e,this.b*e,this.opacity)},darker(e){return e=e==null?_s:Math.pow(_s,e),new Je(this.r*e,this.g*e,this.b*e,this.opacity)},rgb(){return this},clamp(){return new Je(ms(this.r),ms(this.g),ms(this.b),Wh(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:Ey,formatHex:Ey,formatHex8:S2,formatRgb:Ty,toString:Ty}));function Ey(){return`#${ps(this.r)}${ps(this.g)}${ps(this.b)}`}function S2(){return`#${ps(this.r)}${ps(this.g)}${ps(this.b)}${ps((isNaN(this.opacity)?1:this.opacity)*255)}`}function Ty(){let e=Wh(this.opacity);return`${e===1?"rgb(":"rgba("}${ms(this.r)}, ${ms(this.g)}, ${ms(this.b)}${e===1?")":`, ${e})`}`}function Wh(e){return isNaN(e)?1:Math.max(0,Math.min(1,e))}function ms(e){return Math.max(0,Math.min(255,Math.round(e)||0))}function ps(e){return e=ms(e),(e<16?"0":"")+e.toString(16)}function Ay(e,t,n,i){return i<=0?e=t=n=NaN:n<=0||n>=1?e=t=NaN:t<=0&&(e=NaN),new yi(e,t,n,i)}function Ly(e){if(e instanceof yi)return new yi(e.h,e.s,e.l,e.opacity);if(e instanceof kr||(e=jh(e)),!e)return new yi;if(e instanceof yi)return e;e=e.rgb();var t=e.r/255,n=e.g/255,i=e.b/255,r=Math.min(t,n,i),s=Math.max(t,n,i),o=NaN,a=s-r,c=(s+r)/2;return a?(t===s?o=(n-i)/a+(n<i)*6:n===s?o=(i-t)/a+2:o=(t-n)/a+4,a/=c<.5?s+r:2-s-r,o*=60):a=c>0&&c<1?0:o,new yi(o,a,c,e.opacity)}function qh(e,t,n,i){return arguments.length===1?Ly(e):new yi(e,t,n,i??1)}function yi(e,t,n,i){this.h=+e,this.s=+t,this.l=+n,this.opacity=+i}To(yi,qh,Za(kr,{brighter(e){return e=e==null?Eo:Math.pow(Eo,e),new yi(this.h,this.s,this.l*e,this.opacity)},darker(e){return e=e==null?_s:Math.pow(_s,e),new yi(this.h,this.s,this.l*e,this.opacity)},rgb(){var e=this.h%360+(this.h<0)*360,t=isNaN(e)||isNaN(this.s)?0:this.s,n=this.l,i=n+(n<.5?n:1-n)*t,r=2*n-i;return new Je(ep(e>=240?e-240:e+120,r,i),ep(e,r,i),ep(e<120?e+240:e-120,r,i),this.opacity)},clamp(){return new yi(Cy(this.h),Hh(this.s),Hh(this.l),Wh(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){let e=Wh(this.opacity);return`${e===1?"hsl(":"hsla("}${Cy(this.h)}, ${Hh(this.s)*100}%, ${Hh(this.l)*100}%${e===1?")":`, ${e})`}`}}));function Cy(e){return e=(e||0)%360,e<0?e+360:e}function Hh(e){return Math.max(0,Math.min(1,e||0))}function ep(e,t,n){return(e<60?t+(n-t)*e/60:e<180?n:e<240?t+(n-t)*(240-e)/60:t)*255}var Dy=Math.PI/180,Ny=180/Math.PI,$h=18,Oy=.96422,Fy=1,Uy=.82521,ky=4/29,wo=6/29,By=3*wo*wo,w2=wo*wo*wo;function zy(e){if(e instanceof Ui)return new Ui(e.l,e.a,e.b,e.opacity);if(e instanceof cr)return Vy(e);e instanceof Je||(e=op(e));var t=sp(e.r),n=sp(e.g),i=sp(e.b),r=np((.2225045*t+.7168786*n+.0606169*i)/Fy),s,o;return t===n&&n===i?s=o=r:(s=np((.4360747*t+.3850649*n+.1430804*i)/Oy),o=np((.0139322*t+.0971045*n+.7141733*i)/Uy)),new Ui(116*r-16,500*(s-r),200*(r-o),e.opacity)}function Gy(e,t,n,i){return arguments.length===1?zy(e):new Ui(e,t,n,i??1)}function Ui(e,t,n,i){this.l=+e,this.a=+t,this.b=+n,this.opacity=+i}To(Ui,Gy,Za(kr,{brighter(e){return new Ui(this.l+$h*(e??1),this.a,this.b,this.opacity)},darker(e){return new Ui(this.l-$h*(e??1),this.a,this.b,this.opacity)},rgb(){var e=(this.l+16)/116,t=isNaN(this.a)?e:e+this.a/500,n=isNaN(this.b)?e:e-this.b/200;return t=Oy*ip(t),e=Fy*ip(e),n=Uy*ip(n),new Je(rp(3.1338561*t-1.6168667*e-.4906146*n),rp(-.9787684*t+1.9161415*e+.033454*n),rp(.0719453*t-.2289914*e+1.4052427*n),this.opacity)}}));function np(e){return e>w2?Math.pow(e,1/3):e/By+ky}function ip(e){return e>wo?e*e*e:By*(e-ky)}function rp(e){return 255*(e<=.0031308?12.92*e:1.055*Math.pow(e,1/2.4)-.055)}function sp(e){return(e/=255)<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4)}function E2(e){if(e instanceof cr)return new cr(e.h,e.c,e.l,e.opacity);if(e instanceof Ui||(e=zy(e)),e.a===0&&e.b===0)return new cr(NaN,0<e.l&&e.l<100?0:NaN,e.l,e.opacity);var t=Math.atan2(e.b,e.a)*Ny;return new cr(t<0?t+360:t,Math.sqrt(e.a*e.a+e.b*e.b),e.l,e.opacity)}function Xh(e,t,n,i){return arguments.length===1?E2(e):new cr(e,t,n,i??1)}function cr(e,t,n,i){this.h=+e,this.c=+t,this.l=+n,this.opacity=+i}function Vy(e){if(isNaN(e.h))return new Ui(e.l,0,0,e.opacity);var t=e.h*Dy;return new Ui(e.l,Math.cos(t)*e.c,Math.sin(t)*e.c,e.opacity)}To(cr,Xh,Za(kr,{brighter(e){return new cr(this.h,this.c,this.l+$h*(e??1),this.opacity)},darker(e){return new cr(this.h,this.c,this.l-$h*(e??1),this.opacity)},rgb(){return Vy(this).rgb()}}));var Hy=-.14861,ap=1.78277,cp=-.29227,Yh=-.90649,Ya=1.97294,Ry=Ya*Yh,Py=Ya*ap,Iy=ap*cp-Yh*Hy;function T2(e){if(e instanceof gs)return new gs(e.h,e.s,e.l,e.opacity);e instanceof Je||(e=op(e));var t=e.r/255,n=e.g/255,i=e.b/255,r=(Iy*i+Ry*t-Py*n)/(Iy+Ry-Py),s=i-r,o=(Ya*(n-r)-cp*s)/Yh,a=Math.sqrt(o*o+s*s)/(Ya*r*(1-r)),c=a?Math.atan2(o,s)*Ny-120:NaN;return new gs(c<0?c+360:c,a,r,e.opacity)}function si(e,t,n,i){return arguments.length===1?T2(e):new gs(e,t,n,i??1)}function gs(e,t,n,i){this.h=+e,this.s=+t,this.l=+n,this.opacity=+i}To(gs,si,Za(kr,{brighter(e){return e=e==null?Eo:Math.pow(Eo,e),new gs(this.h,this.s,this.l*e,this.opacity)},darker(e){return e=e==null?_s:Math.pow(_s,e),new gs(this.h,this.s,this.l*e,this.opacity)},rgb(){var e=isNaN(this.h)?0:(this.h+120)*Dy,t=+this.l,n=isNaN(this.s)?0:this.s*t*(1-t),i=Math.cos(e),r=Math.sin(e);return new Je(255*(t+n*(Hy*i+ap*r)),255*(t+n*(cp*i+Yh*r)),255*(t+n*(Ya*i)),this.opacity)}}));function jy(e,t,n,i,r){var s=e*e,o=s*e;return((1-3*e+3*s-o)*t+(4-6*s+3*o)*n+(1+3*e+3*s-3*o)*i+o*r)/6}function A2(e){var t=e.length-1;return function(n){var i=n<=0?n=0:n>=1?(n=1,t-1):Math.floor(n*t),r=e[i],s=e[i+1],o=i>0?e[i-1]:2*r-s,a=i<t-1?e[i+2]:2*s-r;return jy((n-i/t)*t,o,r,s,a)}}function C2(e){var t=e.length;return function(n){var i=Math.floor(((n%=1)<0?++n:n)*t),r=e[(i+t-1)%t],s=e[i%t],o=e[(i+1)%t],a=e[(i+2)%t];return jy((n-i/t)*t,r,s,o,a)}}var hp=e=>()=>e;function qy(e,t){return function(n){return e+n*t}}function R2(e,t,n){return e=Math.pow(e,n),t=Math.pow(t,n)-e,n=1/n,function(i){return Math.pow(e+i*t,n)}}function up(e,t){var n=t-e;return n?qy(e,n>180||n<-180?n-360*Math.round(n/360):n):hp(isNaN(e)?t:e)}function P2(e){return(e=+e)==1?Nn:function(t,n){return n-t?R2(t,n,e):hp(isNaN(t)?n:t)}}function Nn(e,t){var n=t-e;return n?qy(e,n):hp(isNaN(e)?t:e)}var BU=(function e(t){var n=P2(t);function i(r,s){var o=n((r=ys(r)).r,(s=ys(s)).r),a=n(r.g,s.g),c=n(r.b,s.b),l=Nn(r.opacity,s.opacity);return function(h){return r.r=o(h),r.g=a(h),r.b=c(h),r.opacity=l(h),r+""}}return i.gamma=e,i})(1);function Xy(e){return function(t){var n=t.length,i=new Array(n),r=new Array(n),s=new Array(n),o,a;for(o=0;o<n;++o)a=ys(t[o]),i[o]=a.r||0,r[o]=a.g||0,s[o]=a.b||0;return i=e(i),r=e(r),s=e(s),a.opacity=1,function(c){return a.r=i(c),a.g=r(c),a.b=s(c),a+""}}}var Yy=Xy(A2),zU=Xy(C2);function Ao(e,t){return e=+e,t=+t,function(n){return e*(1-n)+t*n}}var I2=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,GU=new RegExp(I2.source,"g");var Wy=180/Math.PI,lp={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function Zy(e,t,n,i,r,s){var o,a,c;return(o=Math.sqrt(e*e+t*t))&&(e/=o,t/=o),(c=e*n+t*i)&&(n-=e*c,i-=t*c),(a=Math.sqrt(n*n+i*i))&&(n/=a,i/=a,c/=a),e*i<t*n&&(e=-e,t=-t,c=-c,o=-o),{translateX:r,translateY:s,rotate:Math.atan2(t,e)*Wy,skewX:Math.atan(c)*Wy,scaleX:o,scaleY:a}}var Zh;function L2(e){let t=new(typeof DOMMatrix=="function"?DOMMatrix:WebKitCSSMatrix)(e+"");return t.isIdentity?lp:Zy(t.a,t.b,t.c,t.d,t.e,t.f)}function D2(e){return e==null||(Zh||(Zh=document.createElementNS("http://www.w3.org/2000/svg","g")),Zh.setAttribute("transform",e),!(e=Zh.transform.baseVal.consolidate()))?lp:(e=e.matrix,Zy(e.a,e.b,e.c,e.d,e.e,e.f))}function Ky(e,t,n,i){function r(l){return l.length?l.pop()+" ":""}function s(l,h,u,d,f,p){if(l!==u||h!==d){var _=f.push("translate(",null,t,null,n);p.push({i:_-4,x:Ao(l,u)},{i:_-2,x:Ao(h,d)})}else(u||d)&&f.push("translate("+u+t+d+n)}function o(l,h,u,d){l!==h?(l-h>180?h+=360:h-l>180&&(l+=360),d.push({i:u.push(r(u)+"rotate(",null,i)-2,x:Ao(l,h)})):h&&u.push(r(u)+"rotate("+h+i)}function a(l,h,u,d){l!==h?d.push({i:u.push(r(u)+"skewX(",null,i)-2,x:Ao(l,h)}):h&&u.push(r(u)+"skewX("+h+i)}function c(l,h,u,d,f,p){if(l!==u||h!==d){var _=f.push(r(f)+"scale(",null,",",null,")");p.push({i:_-4,x:Ao(l,u)},{i:_-2,x:Ao(h,d)})}else(u!==1||d!==1)&&f.push(r(f)+"scale("+u+","+d+")")}return function(l,h){var u=[],d=[];return l=e(l),h=e(h),s(l.translateX,l.translateY,h.translateX,h.translateY,u,d),o(l.rotate,h.rotate,u,d),a(l.skewX,h.skewX,u,d),c(l.scaleX,l.scaleY,h.scaleX,h.scaleY,u,d),l=h=null,function(f){for(var p=-1,_=d.length,g;++p<_;)u[(g=d[p]).i]=g.x(f);return u.join("")}}}var VU=Ky(L2,"px, ","px)","deg)"),HU=Ky(D2,", ",")",")"),N2=1e-12;function $y(e){return((e=Math.exp(e))+1/e)/2}function O2(e){return((e=Math.exp(e))-1/e)/2}function F2(e){return((e=Math.exp(2*e))-1)/(e+1)}var WU=(function e(t,n,i){function r(s,o){var a=s[0],c=s[1],l=s[2],h=o[0],u=o[1],d=o[2],f=h-a,p=u-c,_=f*f+p*p,g,m;if(_<N2)m=Math.log(d/l)/t,g=function(v){return[a+v*f,c+v*p,l*Math.exp(t*v*m)]};else{var y=Math.sqrt(_),x=(d*d-l*l+i*_)/(2*l*n*y),b=(d*d-l*l-i*_)/(2*d*n*y),S=Math.log(Math.sqrt(x*x+1)-x),w=Math.log(Math.sqrt(b*b+1)-b);m=(w-S)/t,g=function(v){var M=v*m,U=$y(S),P=l/(n*y)*(U*F2(t*M+S)-O2(S));return[a+P*f,c+P*p,l*U/$y(t*M+S)]}}return g.duration=Math.abs(m)*1e3*t/Math.SQRT2,g}return r.rho=function(s){var o=Math.max(.001,+s),a=o*o,c=a*a;return e(o,a,c)},r})(Math.SQRT2,2,4);function Jy(e){return function(t,n){var i=e((t=qh(t)).h,(n=qh(n)).h),r=Nn(t.s,n.s),s=Nn(t.l,n.l),o=Nn(t.opacity,n.opacity);return function(a){return t.h=i(a),t.s=r(a),t.l=s(a),t.opacity=o(a),t+""}}}var $U=Jy(up),jU=Jy(Nn);function Qy(e){return function(t,n){var i=e((t=Xh(t)).h,(n=Xh(n)).h),r=Nn(t.c,n.c),s=Nn(t.l,n.l),o=Nn(t.opacity,n.opacity);return function(a){return t.h=i(a),t.c=r(a),t.l=s(a),t.opacity=o(a),t+""}}}var qU=Qy(up),XU=Qy(Nn);function tv(e){return(function t(n){n=+n;function i(r,s){var o=e((r=si(r)).h,(s=si(s)).h),a=Nn(r.s,s.s),c=Nn(r.l,s.l),l=Nn(r.opacity,s.opacity);return function(h){return r.h=o(h),r.s=a(h),r.l=c(Math.pow(h,n)),r.opacity=l(h),r+""}}return i.gamma=t,i})(1)}var YU=tv(up),Kh=tv(Nn);function U2(e,t){switch(arguments.length){case 0:break;case 1:this.range(e);break;default:this.range(t).domain(e);break}return this}var ev=Symbol("implicit");function fp(){var e=new ja,t=[],n=[],i=ev;function r(s){let o=e.get(s);if(o===void 0){if(i!==ev)return i;e.set(s,o=t.push(s)-1)}return n[o%n.length]}return r.domain=function(s){if(!arguments.length)return t.slice();t=[],e=new ja;for(let o of s)e.has(o)||e.set(o,t.push(o)-1);return r},r.range=function(s){return arguments.length?(n=Array.from(s),r):n.slice()},r.unknown=function(s){return arguments.length?(i=s,r):i},r.copy=function(){return fp(t,n).unknown(i)},U2.apply(r,arguments),r}function Jt(e){for(var t=e.length/6|0,n=new Array(t),i=0;i<t;)n[i]="#"+e.slice(i*6,++i*6);return n}var a5=Jt("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf"),c5=Jt("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666"),l5=Jt("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666"),h5=Jt("4269d0efb118ff725c6cc5b03ca951ff8ab7a463f297bbf59c6b4e9498a0"),nv=Jt("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928"),u5=Jt("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2"),f5=Jt("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc"),d5=Jt("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999"),p5=Jt("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3"),m5=Jt("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f"),g5=Jt("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab"),Ee=e=>Yy(e[e.length-1]),k2=new Array(3).concat("d8b365f5f5f55ab4ac","a6611adfc27d80cdc1018571","a6611adfc27df5f5f580cdc1018571","8c510ad8b365f6e8c3c7eae55ab4ac01665e","8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e","8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e","8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e","5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30","5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30").map(Jt),_5=Ee(k2),B2=new Array(3).concat("af8dc3f7f7f77fbf7b","7b3294c2a5cfa6dba0008837","7b3294c2a5cff7f7f7a6dba0008837","762a83af8dc3e7d4e8d9f0d37fbf7b1b7837","762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837","762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837","762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837","40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b","40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b").map(Jt),y5=Ee(B2),z2=new Array(3).concat("e9a3c9f7f7f7a1d76a","d01c8bf1b6dab8e1864dac26","d01c8bf1b6daf7f7f7b8e1864dac26","c51b7de9a3c9fde0efe6f5d0a1d76a4d9221","c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221","c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221","c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221","8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419","8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419").map(Jt),v5=Ee(z2),G2=new Array(3).concat("998ec3f7f7f7f1a340","5e3c99b2abd2fdb863e66101","5e3c99b2abd2f7f7f7fdb863e66101","542788998ec3d8daebfee0b6f1a340b35806","542788998ec3d8daebf7f7f7fee0b6f1a340b35806","5427888073acb2abd2d8daebfee0b6fdb863e08214b35806","5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806","2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08","2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08").map(Jt),b5=Ee(G2),V2=new Array(3).concat("ef8a62f7f7f767a9cf","ca0020f4a58292c5de0571b0","ca0020f4a582f7f7f792c5de0571b0","b2182bef8a62fddbc7d1e5f067a9cf2166ac","b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac","b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac","b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac","67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061","67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061").map(Jt),x5=Ee(V2),H2=new Array(3).concat("ef8a62ffffff999999","ca0020f4a582bababa404040","ca0020f4a582ffffffbababa404040","b2182bef8a62fddbc7e0e0e09999994d4d4d","b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d","b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d","b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d","67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a","67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a").map(Jt),M5=Ee(H2),W2=new Array(3).concat("fc8d59ffffbf91bfdb","d7191cfdae61abd9e92c7bb6","d7191cfdae61ffffbfabd9e92c7bb6","d73027fc8d59fee090e0f3f891bfdb4575b4","d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4","d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4","d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4","a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695","a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695").map(Jt),S5=Ee(W2),$2=new Array(3).concat("fc8d59ffffbf91cf60","d7191cfdae61a6d96a1a9641","d7191cfdae61ffffbfa6d96a1a9641","d73027fc8d59fee08bd9ef8b91cf601a9850","d73027fc8d59fee08bffffbfd9ef8b91cf601a9850","d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850","d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850","a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837","a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837").map(Jt),w5=Ee($2),j2=new Array(3).concat("fc8d59ffffbf99d594","d7191cfdae61abdda42b83ba","d7191cfdae61ffffbfabdda42b83ba","d53e4ffc8d59fee08be6f59899d5943288bd","d53e4ffc8d59fee08bffffbfe6f59899d5943288bd","d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd","d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd","9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2","9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2").map(Jt),E5=Ee(j2),q2=new Array(3).concat("e5f5f999d8c92ca25f","edf8fbb2e2e266c2a4238b45","edf8fbb2e2e266c2a42ca25f006d2c","edf8fbccece699d8c966c2a42ca25f006d2c","edf8fbccece699d8c966c2a441ae76238b45005824","f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824","f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b").map(Jt),T5=Ee(q2),X2=new Array(3).concat("e0ecf49ebcda8856a7","edf8fbb3cde38c96c688419d","edf8fbb3cde38c96c68856a7810f7c","edf8fbbfd3e69ebcda8c96c68856a7810f7c","edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b","f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b","f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b").map(Jt),A5=Ee(X2),Y2=new Array(3).concat("e0f3dba8ddb543a2ca","f0f9e8bae4bc7bccc42b8cbe","f0f9e8bae4bc7bccc443a2ca0868ac","f0f9e8ccebc5a8ddb57bccc443a2ca0868ac","f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e","f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e","f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081").map(Jt),C5=Ee(Y2),Z2=new Array(3).concat("fee8c8fdbb84e34a33","fef0d9fdcc8afc8d59d7301f","fef0d9fdcc8afc8d59e34a33b30000","fef0d9fdd49efdbb84fc8d59e34a33b30000","fef0d9fdd49efdbb84fc8d59ef6548d7301f990000","fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000","fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000").map(Jt),R5=Ee(Z2),K2=new Array(3).concat("ece2f0a6bddb1c9099","f6eff7bdc9e167a9cf02818a","f6eff7bdc9e167a9cf1c9099016c59","f6eff7d0d1e6a6bddb67a9cf1c9099016c59","f6eff7d0d1e6a6bddb67a9cf3690c002818a016450","fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450","fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636").map(Jt),P5=Ee(K2),J2=new Array(3).concat("ece7f2a6bddb2b8cbe","f1eef6bdc9e174a9cf0570b0","f1eef6bdc9e174a9cf2b8cbe045a8d","f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d","f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b","fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b","fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858").map(Jt),I5=Ee(J2),Q2=new Array(3).concat("e7e1efc994c7dd1c77","f1eef6d7b5d8df65b0ce1256","f1eef6d7b5d8df65b0dd1c77980043","f1eef6d4b9dac994c7df65b0dd1c77980043","f1eef6d4b9dac994c7df65b0e7298ace125691003f","f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f","f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f").map(Jt),L5=Ee(Q2),tC=new Array(3).concat("fde0ddfa9fb5c51b8a","feebe2fbb4b9f768a1ae017e","feebe2fbb4b9f768a1c51b8a7a0177","feebe2fcc5c0fa9fb5f768a1c51b8a7a0177","feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177","fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177","fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a").map(Jt),D5=Ee(tC),eC=new Array(3).concat("edf8b17fcdbb2c7fb8","ffffcca1dab441b6c4225ea8","ffffcca1dab441b6c42c7fb8253494","ffffccc7e9b47fcdbb41b6c42c7fb8253494","ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84","ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84","ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58").map(Jt),N5=Ee(eC),nC=new Array(3).concat("f7fcb9addd8e31a354","ffffccc2e69978c679238443","ffffccc2e69978c67931a354006837","ffffccd9f0a3addd8e78c67931a354006837","ffffccd9f0a3addd8e78c67941ab5d238443005a32","ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32","ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529").map(Jt),O5=Ee(nC),iC=new Array(3).concat("fff7bcfec44fd95f0e","ffffd4fed98efe9929cc4c02","ffffd4fed98efe9929d95f0e993404","ffffd4fee391fec44ffe9929d95f0e993404","ffffd4fee391fec44ffe9929ec7014cc4c028c2d04","ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04","ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506").map(Jt),F5=Ee(iC),rC=new Array(3).concat("ffeda0feb24cf03b20","ffffb2fecc5cfd8d3ce31a1c","ffffb2fecc5cfd8d3cf03b20bd0026","ffffb2fed976feb24cfd8d3cf03b20bd0026","ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026","ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026","ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026").map(Jt),U5=Ee(rC),sC=new Array(3).concat("deebf79ecae13182bd","eff3ffbdd7e76baed62171b5","eff3ffbdd7e76baed63182bd08519c","eff3ffc6dbef9ecae16baed63182bd08519c","eff3ffc6dbef9ecae16baed64292c62171b5084594","f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594","f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b").map(Jt),k5=Ee(sC),oC=new Array(3).concat("e5f5e0a1d99b31a354","edf8e9bae4b374c476238b45","edf8e9bae4b374c47631a354006d2c","edf8e9c7e9c0a1d99b74c47631a354006d2c","edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32","f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32","f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b").map(Jt),B5=Ee(oC),aC=new Array(3).concat("f0f0f0bdbdbd636363","f7f7f7cccccc969696525252","f7f7f7cccccc969696636363252525","f7f7f7d9d9d9bdbdbd969696636363252525","f7f7f7d9d9d9bdbdbd969696737373525252252525","fffffff0f0f0d9d9d9bdbdbd969696737373525252252525","fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000").map(Jt),z5=Ee(aC),cC=new Array(3).concat("efedf5bcbddc756bb1","f2f0f7cbc9e29e9ac86a51a3","f2f0f7cbc9e29e9ac8756bb154278f","f2f0f7dadaebbcbddc9e9ac8756bb154278f","f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486","fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486","fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d").map(Jt),G5=Ee(cC),lC=new Array(3).concat("fee0d2fc9272de2d26","fee5d9fcae91fb6a4acb181d","fee5d9fcae91fb6a4ade2d26a50f15","fee5d9fcbba1fc9272fb6a4ade2d26a50f15","fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d","fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d","fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d").map(Jt),V5=Ee(lC),hC=new Array(3).concat("fee6cefdae6be6550d","feeddefdbe85fd8d3cd94701","feeddefdbe85fd8d3ce6550da63603","feeddefdd0a2fdae6bfd8d3ce6550da63603","feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04","fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04","fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704").map(Jt),H5=Ee(hC);var W5=Kh(si(300,.5,0),si(-240,.5,1)),$5=Kh(si(-100,.75,.35),si(80,1.5,.8)),j5=Kh(si(260,.75,.35),si(80,1.5,.8)),q5=si();var X5=ys(),Y5=Math.PI/3,Z5=Math.PI*2/3;function Jh(e){var t=e.length;return function(n){return e[Math.max(0,Math.min(t-1,Math.floor(n*t)))]}}var K5=Jh(Jt("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725")),J5=Jh(Jt("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf")),Q5=Jh(Jt("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4")),t4=Jh(Jt("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));function Qh(e){"@babel/helpers - typeof";return Qh=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Qh(e)}var uC=/^\s+/,fC=/\s+$/;function Ft(e,t){if(e=e||"",t=t||{},e instanceof Ft)return e;if(!(this instanceof Ft))return new Ft(e,t);var n=dC(e);this._originalInput=e,this._r=n.r,this._g=n.g,this._b=n.b,this._a=n.a,this._roundA=Math.round(100*this._a)/100,this._format=t.format||n.format,this._gradientType=t.gradientType,this._r<1&&(this._r=Math.round(this._r)),this._g<1&&(this._g=Math.round(this._g)),this._b<1&&(this._b=Math.round(this._b)),this._ok=n.ok}Ft.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var t=this.toRgb();return(t.r*299+t.g*587+t.b*114)/1e3},getLuminance:function(){var t=this.toRgb(),n,i,r,s,o,a;return n=t.r/255,i=t.g/255,r=t.b/255,n<=.03928?s=n/12.92:s=Math.pow((n+.055)/1.055,2.4),i<=.03928?o=i/12.92:o=Math.pow((i+.055)/1.055,2.4),r<=.03928?a=r/12.92:a=Math.pow((r+.055)/1.055,2.4),.2126*s+.7152*o+.0722*a},setAlpha:function(t){return this._a=lv(t),this._roundA=Math.round(100*this._a)/100,this},toHsv:function(){var t=rv(this._r,this._g,this._b);return{h:t.h*360,s:t.s,v:t.v,a:this._a}},toHsvString:function(){var t=rv(this._r,this._g,this._b),n=Math.round(t.h*360),i=Math.round(t.s*100),r=Math.round(t.v*100);return this._a==1?"hsv("+n+", "+i+"%, "+r+"%)":"hsva("+n+", "+i+"%, "+r+"%, "+this._roundA+")"},toHsl:function(){var t=iv(this._r,this._g,this._b);return{h:t.h*360,s:t.s,l:t.l,a:this._a}},toHslString:function(){var t=iv(this._r,this._g,this._b),n=Math.round(t.h*360),i=Math.round(t.s*100),r=Math.round(t.l*100);return this._a==1?"hsl("+n+", "+i+"%, "+r+"%)":"hsla("+n+", "+i+"%, "+r+"%, "+this._roundA+")"},toHex:function(t){return sv(this._r,this._g,this._b,t)},toHexString:function(t){return"#"+this.toHex(t)},toHex8:function(t){return _C(this._r,this._g,this._b,this._a,t)},toHex8String:function(t){return"#"+this.toHex8(t)},toRgb:function(){return{r:Math.round(this._r),g:Math.round(this._g),b:Math.round(this._b),a:this._a}},toRgbString:function(){return this._a==1?"rgb("+Math.round(this._r)+", "+Math.round(this._g)+", "+Math.round(this._b)+")":"rgba("+Math.round(this._r)+", "+Math.round(this._g)+", "+Math.round(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:Math.round(Le(this._r,255)*100)+"%",g:Math.round(Le(this._g,255)*100)+"%",b:Math.round(Le(this._b,255)*100)+"%",a:this._a}},toPercentageRgbString:function(){return this._a==1?"rgb("+Math.round(Le(this._r,255)*100)+"%, "+Math.round(Le(this._g,255)*100)+"%, "+Math.round(Le(this._b,255)*100)+"%)":"rgba("+Math.round(Le(this._r,255)*100)+"%, "+Math.round(Le(this._g,255)*100)+"%, "+Math.round(Le(this._b,255)*100)+"%, "+this._roundA+")"},toName:function(){return this._a===0?"transparent":this._a<1?!1:RC[sv(this._r,this._g,this._b,!0)]||!1},toFilter:function(t){var n="#"+ov(this._r,this._g,this._b,this._a),i=n,r=this._gradientType?"GradientType = 1, ":"";if(t){var s=Ft(t);i="#"+ov(s._r,s._g,s._b,s._a)}return"progid:DXImageTransform.Microsoft.gradient("+r+"startColorstr="+n+",endColorstr="+i+")"},toString:function(t){var n=!!t;t=t||this._format;var i=!1,r=this._a<1&&this._a>=0,s=!n&&r&&(t==="hex"||t==="hex6"||t==="hex3"||t==="hex4"||t==="hex8"||t==="name");return s?t==="name"&&this._a===0?this.toName():this.toRgbString():(t==="rgb"&&(i=this.toRgbString()),t==="prgb"&&(i=this.toPercentageRgbString()),(t==="hex"||t==="hex6")&&(i=this.toHexString()),t==="hex3"&&(i=this.toHexString(!0)),t==="hex4"&&(i=this.toHex8String(!0)),t==="hex8"&&(i=this.toHex8String()),t==="name"&&(i=this.toName()),t==="hsl"&&(i=this.toHslString()),t==="hsv"&&(i=this.toHsvString()),i||this.toHexString())},clone:function(){return Ft(this.toString())},_applyModification:function(t,n){var i=t.apply(null,[this].concat([].slice.call(n)));return this._r=i._r,this._g=i._g,this._b=i._b,this.setAlpha(i._a),this},lighten:function(){return this._applyModification(xC,arguments)},brighten:function(){return this._applyModification(MC,arguments)},darken:function(){return this._applyModification(SC,arguments)},desaturate:function(){return this._applyModification(yC,arguments)},saturate:function(){return this._applyModification(vC,arguments)},greyscale:function(){return this._applyModification(bC,arguments)},spin:function(){return this._applyModification(wC,arguments)},_applyCombination:function(t,n){return t.apply(null,[this].concat([].slice.call(n)))},analogous:function(){return this._applyCombination(AC,arguments)},complement:function(){return this._applyCombination(EC,arguments)},monochromatic:function(){return this._applyCombination(CC,arguments)},splitcomplement:function(){return this._applyCombination(TC,arguments)},triad:function(){return this._applyCombination(av,[3])},tetrad:function(){return this._applyCombination(av,[4])}};Ft.fromRatio=function(e,t){if(Qh(e)=="object"){var n={};for(var i in e)e.hasOwnProperty(i)&&(i==="a"?n[i]=e[i]:n[i]=Ka(e[i]));e=n}return Ft(e,t)};function dC(e){var t={r:0,g:0,b:0},n=1,i=null,r=null,s=null,o=!1,a=!1;return typeof e=="string"&&(e=DC(e)),Qh(e)=="object"&&(lr(e.r)&&lr(e.g)&&lr(e.b)?(t=pC(e.r,e.g,e.b),o=!0,a=String(e.r).substr(-1)==="%"?"prgb":"rgb"):lr(e.h)&&lr(e.s)&&lr(e.v)?(i=Ka(e.s),r=Ka(e.v),t=gC(e.h,i,r),o=!0,a="hsv"):lr(e.h)&&lr(e.s)&&lr(e.l)&&(i=Ka(e.s),s=Ka(e.l),t=mC(e.h,i,s),o=!0,a="hsl"),e.hasOwnProperty("a")&&(n=e.a)),n=lv(n),{ok:o,format:e.format||a,r:Math.min(255,Math.max(t.r,0)),g:Math.min(255,Math.max(t.g,0)),b:Math.min(255,Math.max(t.b,0)),a:n}}function pC(e,t,n){return{r:Le(e,255)*255,g:Le(t,255)*255,b:Le(n,255)*255}}function iv(e,t,n){e=Le(e,255),t=Le(t,255),n=Le(n,255);var i=Math.max(e,t,n),r=Math.min(e,t,n),s,o,a=(i+r)/2;if(i==r)s=o=0;else{var c=i-r;switch(o=a>.5?c/(2-i-r):c/(i+r),i){case e:s=(t-n)/c+(t<n?6:0);break;case t:s=(n-e)/c+2;break;case n:s=(e-t)/c+4;break}s/=6}return{h:s,s:o,l:a}}function mC(e,t,n){var i,r,s;e=Le(e,360),t=Le(t,100),n=Le(n,100);function o(l,h,u){return u<0&&(u+=1),u>1&&(u-=1),u<1/6?l+(h-l)*6*u:u<1/2?h:u<2/3?l+(h-l)*(2/3-u)*6:l}if(t===0)i=r=s=n;else{var a=n<.5?n*(1+t):n+t-n*t,c=2*n-a;i=o(c,a,e+1/3),r=o(c,a,e),s=o(c,a,e-1/3)}return{r:i*255,g:r*255,b:s*255}}function rv(e,t,n){e=Le(e,255),t=Le(t,255),n=Le(n,255);var i=Math.max(e,t,n),r=Math.min(e,t,n),s,o,a=i,c=i-r;if(o=i===0?0:c/i,i==r)s=0;else{switch(i){case e:s=(t-n)/c+(t<n?6:0);break;case t:s=(n-e)/c+2;break;case n:s=(e-t)/c+4;break}s/=6}return{h:s,s:o,v:a}}function gC(e,t,n){e=Le(e,360)*6,t=Le(t,100),n=Le(n,100);var i=Math.floor(e),r=e-i,s=n*(1-t),o=n*(1-r*t),a=n*(1-(1-r)*t),c=i%6,l=[n,o,s,s,a,n][c],h=[a,n,n,o,s,s][c],u=[s,s,a,n,n,o][c];return{r:l*255,g:h*255,b:u*255}}function sv(e,t,n,i){var r=[bi(Math.round(e).toString(16)),bi(Math.round(t).toString(16)),bi(Math.round(n).toString(16))];return i&&r[0].charAt(0)==r[0].charAt(1)&&r[1].charAt(0)==r[1].charAt(1)&&r[2].charAt(0)==r[2].charAt(1)?r[0].charAt(0)+r[1].charAt(0)+r[2].charAt(0):r.join("")}function _C(e,t,n,i,r){var s=[bi(Math.round(e).toString(16)),bi(Math.round(t).toString(16)),bi(Math.round(n).toString(16)),bi(hv(i))];return r&&s[0].charAt(0)==s[0].charAt(1)&&s[1].charAt(0)==s[1].charAt(1)&&s[2].charAt(0)==s[2].charAt(1)&&s[3].charAt(0)==s[3].charAt(1)?s[0].charAt(0)+s[1].charAt(0)+s[2].charAt(0)+s[3].charAt(0):s.join("")}function ov(e,t,n,i){var r=[bi(hv(i)),bi(Math.round(e).toString(16)),bi(Math.round(t).toString(16)),bi(Math.round(n).toString(16))];return r.join("")}Ft.equals=function(e,t){return!e||!t?!1:Ft(e).toRgbString()==Ft(t).toRgbString()};Ft.random=function(){return Ft.fromRatio({r:Math.random(),g:Math.random(),b:Math.random()})};function yC(e,t){t=t===0?0:t||10;var n=Ft(e).toHsl();return n.s-=t/100,n.s=tu(n.s),Ft(n)}function vC(e,t){t=t===0?0:t||10;var n=Ft(e).toHsl();return n.s+=t/100,n.s=tu(n.s),Ft(n)}function bC(e){return Ft(e).desaturate(100)}function xC(e,t){t=t===0?0:t||10;var n=Ft(e).toHsl();return n.l+=t/100,n.l=tu(n.l),Ft(n)}function MC(e,t){t=t===0?0:t||10;var n=Ft(e).toRgb();return n.r=Math.max(0,Math.min(255,n.r-Math.round(255*-(t/100)))),n.g=Math.max(0,Math.min(255,n.g-Math.round(255*-(t/100)))),n.b=Math.max(0,Math.min(255,n.b-Math.round(255*-(t/100)))),Ft(n)}function SC(e,t){t=t===0?0:t||10;var n=Ft(e).toHsl();return n.l-=t/100,n.l=tu(n.l),Ft(n)}function wC(e,t){var n=Ft(e).toHsl(),i=(n.h+t)%360;return n.h=i<0?360+i:i,Ft(n)}function EC(e){var t=Ft(e).toHsl();return t.h=(t.h+180)%360,Ft(t)}function av(e,t){if(isNaN(t)||t<=0)throw new Error("Argument to polyad must be a positive number");for(var n=Ft(e).toHsl(),i=[Ft(e)],r=360/t,s=1;s<t;s++)i.push(Ft({h:(n.h+s*r)%360,s:n.s,l:n.l}));return i}function TC(e){var t=Ft(e).toHsl(),n=t.h;return[Ft(e),Ft({h:(n+72)%360,s:t.s,l:t.l}),Ft({h:(n+216)%360,s:t.s,l:t.l})]}function AC(e,t,n){t=t||6,n=n||30;var i=Ft(e).toHsl(),r=360/n,s=[Ft(e)];for(i.h=(i.h-(r*t>>1)+720)%360;--t;)i.h=(i.h+r)%360,s.push(Ft(i));return s}function CC(e,t){t=t||6;for(var n=Ft(e).toHsv(),i=n.h,r=n.s,s=n.v,o=[],a=1/t;t--;)o.push(Ft({h:i,s:r,v:s})),s=(s+a)%1;return o}Ft.mix=function(e,t,n){n=n===0?0:n||50;var i=Ft(e).toRgb(),r=Ft(t).toRgb(),s=n/100,o={r:(r.r-i.r)*s+i.r,g:(r.g-i.g)*s+i.g,b:(r.b-i.b)*s+i.b,a:(r.a-i.a)*s+i.a};return Ft(o)};Ft.readability=function(e,t){var n=Ft(e),i=Ft(t);return(Math.max(n.getLuminance(),i.getLuminance())+.05)/(Math.min(n.getLuminance(),i.getLuminance())+.05)};Ft.isReadable=function(e,t,n){var i=Ft.readability(e,t),r,s;switch(s=!1,r=NC(n),r.level+r.size){case"AAsmall":case"AAAlarge":s=i>=4.5;break;case"AAlarge":s=i>=3;break;case"AAAsmall":s=i>=7;break}return s};Ft.mostReadable=function(e,t,n){var i=null,r=0,s,o,a,c;n=n||{},o=n.includeFallbackColors,a=n.level,c=n.size;for(var l=0;l<t.length;l++)s=Ft.readability(e,t[l]),s>r&&(r=s,i=Ft(t[l]));return Ft.isReadable(e,i,{level:a,size:c})||!o?i:(n.includeFallbackColors=!1,Ft.mostReadable(e,["#fff","#000"],n))};var dp=Ft.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},RC=Ft.hexNames=PC(dp);function PC(e){var t={};for(var n in e)e.hasOwnProperty(n)&&(t[e[n]]=n);return t}function lv(e){return e=parseFloat(e),(isNaN(e)||e<0||e>1)&&(e=1),e}function Le(e,t){IC(e)&&(e="100%");var n=LC(e);return e=Math.min(t,Math.max(0,parseFloat(e))),n&&(e=parseInt(e*t,10)/100),Math.abs(e-t)<1e-6?1:e%t/parseFloat(t)}function tu(e){return Math.min(1,Math.max(0,e))}function Xn(e){return parseInt(e,16)}function IC(e){return typeof e=="string"&&e.indexOf(".")!=-1&&parseFloat(e)===1}function LC(e){return typeof e=="string"&&e.indexOf("%")!=-1}function bi(e){return e.length==1?"0"+e:""+e}function Ka(e){return e<=1&&(e=e*100+"%"),e}function hv(e){return Math.round(parseFloat(e)*255).toString(16)}function cv(e){return Xn(e)/255}var vi=(function(){var e="[-\\+]?\\d+%?",t="[-\\+]?\\d*\\.\\d+%?",n="(?:"+t+")|(?:"+e+")",i="[\\s|\\(]+("+n+")[,|\\s]+("+n+")[,|\\s]+("+n+")\\s*\\)?",r="[\\s|\\(]+("+n+")[,|\\s]+("+n+")[,|\\s]+("+n+")[,|\\s]+("+n+")\\s*\\)?";return{CSS_UNIT:new RegExp(n),rgb:new RegExp("rgb"+i),rgba:new RegExp("rgba"+r),hsl:new RegExp("hsl"+i),hsla:new RegExp("hsla"+r),hsv:new RegExp("hsv"+i),hsva:new RegExp("hsva"+r),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}})();function lr(e){return!!vi.CSS_UNIT.exec(e)}function DC(e){e=e.replace(uC,"").replace(fC,"").toLowerCase();var t=!1;if(dp[e])e=dp[e],t=!0;else if(e=="transparent")return{r:0,g:0,b:0,a:0,format:"name"};var n;return(n=vi.rgb.exec(e))?{r:n[1],g:n[2],b:n[3]}:(n=vi.rgba.exec(e))?{r:n[1],g:n[2],b:n[3],a:n[4]}:(n=vi.hsl.exec(e))?{h:n[1],s:n[2],l:n[3]}:(n=vi.hsla.exec(e))?{h:n[1],s:n[2],l:n[3],a:n[4]}:(n=vi.hsv.exec(e))?{h:n[1],s:n[2],v:n[3]}:(n=vi.hsva.exec(e))?{h:n[1],s:n[2],v:n[3],a:n[4]}:(n=vi.hex8.exec(e))?{r:Xn(n[1]),g:Xn(n[2]),b:Xn(n[3]),a:cv(n[4]),format:t?"name":"hex8"}:(n=vi.hex6.exec(e))?{r:Xn(n[1]),g:Xn(n[2]),b:Xn(n[3]),format:t?"name":"hex"}:(n=vi.hex4.exec(e))?{r:Xn(n[1]+""+n[1]),g:Xn(n[2]+""+n[2]),b:Xn(n[3]+""+n[3]),a:cv(n[4]+""+n[4]),format:t?"name":"hex8"}:(n=vi.hex3.exec(e))?{r:Xn(n[1]+""+n[1]),g:Xn(n[2]+""+n[2]),b:Xn(n[3]+""+n[3]),format:t?"name":"hex"}:!1}function NC(e){var t,n;return e=e||{level:"AA",size:"small"},t=(e.level||"AA").toUpperCase(),n=(e.size||"small").toLowerCase(),t!=="AA"&&t!=="AAA"&&(t="AA"),n!=="small"&&n!=="large"&&(n="small"),{level:t,size:n}}var mv=e=>{e instanceof Array?e.forEach(mv):(e.map&&e.map.dispose(),e.dispose())},gp=e=>{e.geometry&&e.geometry.dispose(),e.material&&mv(e.material),e.texture&&e.texture.dispose(),e.children&&e.children.forEach(gp)},uv=e=>{for(;e.children.length;){let t=e.children[0];e.remove(t),gp(t)}},Qa,Co,vs=class extends by{constructor(n,{dataBindAttr:i="__data",objBindAttr:r="__threeObj"}={}){super();um(this,"scene");Wu(this,Qa);Wu(this,Co);this.scene=n,$u(this,Qa,i),$u(this,Co,r),this.onRemoveObj(()=>{})}onCreateObj(n){return super.onCreateObj(i=>{let r=n(i);return i[gc(this,Co)]=r,r[gc(this,Qa)]=i,this.scene.add(r),r}),this}onRemoveObj(n){return super.onRemoveObj((i,r)=>{let s=super.getData(i);n(i,r),this.scene.remove(i),gp(i),delete s[gc(this,Co)]}),this}};Qa=new WeakMap,Co=new WeakMap;var Ja=e=>isNaN(e)?parseInt(Ft(e).toHex(),16):e,pp=e=>isNaN(e)?Ft(e).getAlpha():1,OC=fp(nv);function fv(e,t,n){!t||typeof n!="string"||e.filter(i=>!i[n]).forEach(i=>{i[n]=OC(t(i))})}function FC({nodes:e,links:t},n,{nodeFilter:i=()=>!0,onLoopError:r=s=>{throw`Invalid DAG structure! Found cycle in node path: ${s.join(" -> ")}.`}}={}){let s={};e.forEach(l=>s[n(l)]={data:l,out:[],depth:-1,skip:!i(l)}),t.forEach(({source:l,target:h})=>{let u=_(l),d=_(h);if(!s.hasOwnProperty(u))throw`Missing source node with id: ${u}`;if(!s.hasOwnProperty(d))throw`Missing target node with id: ${d}`;let f=s[u],p=s[d];f.out.push(p);function _(g){return typeof g=="object"?n(g):g}});let o=[];return c(Object.values(s)),Object.assign({},...Object.entries(s).filter(([,l])=>!l.skip).map(([l,h])=>({[l]:h.depth})));function c(l,h=[],u=0){for(let d=0,f=l.length;d<f;d++){let p=l[d];if(h.indexOf(p)!==-1){let _=[...h.slice(h.indexOf(p)),p].map(g=>n(g.data));o.some(g=>g.length===_.length&&g.every((m,y)=>m===_[y]))||(o.push(_),r(_));continue}u>p.depth&&(p.depth=u,c(p.out,[...h,p],u+(p.skip?0:1)))}}}var jt=window.THREE?window.THREE:{Group:In,Mesh:Ge,MeshLambertMaterial:Ar,Color:Wt,BufferGeometry:Ae,BufferAttribute:en,Matrix4:Vt,Vector3:O,SphereGeometry:Pi,CylinderGeometry:io,TubeGeometry:da,ConeGeometry:ha,Line:Ci,LineBasicMaterial:Hn,QuadraticBezierCurve3:rs,CubicBezierCurve3:ro,Box3:dn},dv={graph:y_,forcelayout:pv.default},UC=2,mp=new jt.BufferGeometry().setAttribute?"setAttribute":"addAttribute",eu=new jt.BufferGeometry().applyMatrix4?"applyMatrix4":"applyMatrix",kC=Ur({props:{jsonUrl:{onChange:function(e,t){e&&!t.fetchingJson&&(t.fetchingJson=!0,t.onLoading(),fetch(e).then(n=>n.json()).then(n=>{t.fetchingJson=!1,t.onFinishLoading(n),this.graphData(n)}))},triggerUpdate:!1},graphData:{default:{nodes:[],links:[]},onChange(e,t){t.engineRunning=!1}},numDimensions:{default:3,onChange(e,t){let n=t.d3ForceLayout.force("charge");n&&n.strength(e>2?-60:-30),e<3&&i(t.graphData.nodes,"z"),e<2&&i(t.graphData.nodes,"y");function i(r,s){r.forEach(o=>{delete o[s],delete o[`v${s}`]})}}},dagMode:{onChange(e,t){!e&&t.forceEngine==="d3"&&(t.graphData.nodes||[]).forEach(n=>n.fx=n.fy=n.fz=void 0)}},dagLevelDistance:{},dagNodeFilter:{default:e=>!0},onDagError:{triggerUpdate:!1},nodeRelSize:{default:4},nodeId:{default:"id"},nodeVal:{default:"val"},nodeResolution:{default:8},nodeColor:{default:"color"},nodeAutoColorBy:{},nodeOpacity:{default:.75},nodeVisibility:{default:!0},nodeThreeObject:{},nodeThreeObjectExtend:{default:!1},nodePositionUpdate:{triggerUpdate:!1},linkSource:{default:"source"},linkTarget:{default:"target"},linkVisibility:{default:!0},linkColor:{default:"color"},linkAutoColorBy:{},linkOpacity:{default:.2},linkWidth:{},linkResolution:{default:6},linkCurvature:{default:0,triggerUpdate:!1},linkCurveRotation:{default:0,triggerUpdate:!1},linkMaterial:{},linkThreeObject:{},linkThreeObjectExtend:{default:!1},linkPositionUpdate:{triggerUpdate:!1},linkDirectionalArrowLength:{default:0},linkDirectionalArrowColor:{},linkDirectionalArrowRelPos:{default:.5,triggerUpdate:!1},linkDirectionalArrowResolution:{default:8},linkDirectionalParticles:{default:0},linkDirectionalParticleSpeed:{default:.01,triggerUpdate:!1},linkDirectionalParticleOffset:{default:0,triggerUpdate:!1},linkDirectionalParticleWidth:{default:.5},linkDirectionalParticleColor:{},linkDirectionalParticleResolution:{default:4},linkDirectionalParticleThreeObject:{},forceEngine:{default:"d3"},d3AlphaMin:{default:0},d3AlphaDecay:{default:.0228,triggerUpdate:!1,onChange(e,t){t.d3ForceLayout.alphaDecay(e)}},d3AlphaTarget:{default:0,triggerUpdate:!1,onChange(e,t){t.d3ForceLayout.alphaTarget(e)}},d3VelocityDecay:{default:.4,triggerUpdate:!1,onChange(e,t){t.d3ForceLayout.velocityDecay(e)}},ngraphPhysics:{default:{timeStep:20,gravity:-1.2,theta:.8,springLength:30,springCoefficient:8e-4,dragCoefficient:.02}},warmupTicks:{default:0,triggerUpdate:!1},cooldownTicks:{default:1/0,triggerUpdate:!1},cooldownTime:{default:15e3,triggerUpdate:!1},onLoading:{default:()=>{},triggerUpdate:!1},onFinishLoading:{default:()=>{},triggerUpdate:!1},onUpdate:{default:()=>{},triggerUpdate:!1},onFinishUpdate:{default:()=>{},triggerUpdate:!1},onEngineTick:{default:()=>{},triggerUpdate:!1},onEngineStop:{default:()=>{},triggerUpdate:!1}},methods:{refresh:function(e){return e._flushObjects=!0,e._rerender(),this},d3Force:function(e,t,n){return n===void 0?e.d3ForceLayout.force(t):(e.d3ForceLayout.force(t,n),this)},d3ReheatSimulation:function(e){return e.d3ForceLayout.alpha(1),this.resetCountdown(),this},resetCountdown:function(e){return e.cntTicks=0,e.startTickTime=new Date,e.engineRunning=!0,this},tickFrame:function(e){let t=e.forceEngine!=="ngraph";return e.engineRunning&&e.layout&&n(),i(),r(),this;function n(){++e.cntTicks>e.cooldownTicks||new Date-e.startTickTime>e.cooldownTime||t&&e.d3AlphaMin>0&&e.d3ForceLayout.alpha()<e.d3AlphaMin?(e.engineRunning=!1,e.onEngineStop()):(e.layout[t?"tick":"step"](),e.onEngineTick());let s=te(e.nodeThreeObjectExtend);e.nodeDataMapper.entries().forEach(([u,d])=>{if(!d)return;let f=t?u:e.layout.getNodePosition(u[e.nodeId]),p=s(u);(!e.nodePositionUpdate||!e.nodePositionUpdate(p?d.children[0]:d,{x:f.x,y:f.y,z:f.z},u)||p)&&(d.position.x=f.x,d.position.y=f.y||0,d.position.z=f.z||0)});let o=te(e.linkWidth),a=te(e.linkCurvature),c=te(e.linkCurveRotation),l=te(e.linkThreeObjectExtend);e.linkDataMapper.entries().forEach(([u,d])=>{if(!d)return;let f=t?u:e.layout.getLinkPosition(e.layout.graph.getLink(u.source,u.target).id),p=f[t?"source":"from"],_=f[t?"target":"to"];if(!p||!_||!p.hasOwnProperty("x")||!_.hasOwnProperty("x"))return;h(u);let g=l(u);if(e.linkPositionUpdate&&e.linkPositionUpdate(g?d.children[1]:d,{start:{x:p.x,y:p.y,z:p.z},end:{x:_.x,y:_.y,z:_.z}},u)&&!g)return;let m=30,y=u.__curve,x=d.children.length?d.children[0]:d;if(x.type==="Line"){if(y){let b=y.getPoints(m);x.geometry.getAttribute("position").array.length!==b.length*3&&x.geometry[mp]("position",new jt.BufferAttribute(new Float32Array(b.length*3),3)),x.geometry.setFromPoints(b)}else{let b=x.geometry.getAttribute("position");(!b||!b.array||b.array.length!==6)&&x.geometry[mp]("position",b=new jt.BufferAttribute(new Float32Array(6),3)),b.array[0]=p.x,b.array[1]=p.y||0,b.array[2]=p.z||0,b.array[3]=_.x,b.array[4]=_.y||0,b.array[5]=_.z||0,b.needsUpdate=!0}x.geometry.computeBoundingSphere()}else if(x.type==="Mesh")if(y){x.geometry.type.match(/^Tube(Buffer)?Geometry$/)||(x.position.set(0,0,0),x.rotation.set(0,0,0),x.scale.set(1,1,1));let S=Math.ceil(o(u)*10)/10/2,w=new jt.TubeGeometry(y,m,S,e.linkResolution,!1);x.geometry.dispose(),x.geometry=w}else{if(!x.geometry.type.match(/^Cylinder(Buffer)?Geometry$/)){let M=Math.ceil(o(u)*10)/10/2,U=new jt.CylinderGeometry(M,M,1,e.linkResolution,1,!1);U[eu](new jt.Matrix4().makeTranslation(0,1/2,0)),U[eu](new jt.Matrix4().makeRotationX(Math.PI/2)),x.geometry.dispose(),x.geometry=U}let b=new jt.Vector3(p.x,p.y||0,p.z||0),S=new jt.Vector3(_.x,_.y||0,_.z||0),w=b.distanceTo(S);x.position.x=b.x,x.position.y=b.y,x.position.z=b.z,x.scale.z=w,x.parent.localToWorld(S),x.lookAt(S)}});function h(u){let d=t?u:e.layout.getLinkPosition(e.layout.graph.getLink(u.source,u.target).id),f=d[t?"source":"from"],p=d[t?"target":"to"];if(!f||!p||!f.hasOwnProperty("x")||!p.hasOwnProperty("x"))return;let _=a(u);if(!_)u.__curve=null;else{let g=new jt.Vector3(f.x,f.y||0,f.z||0),m=new jt.Vector3(p.x,p.y||0,p.z||0),y=g.distanceTo(m),x,b=c(u);if(y>0){let S=p.x-f.x,w=p.y-f.y||0,v=new jt.Vector3().subVectors(m,g),M=v.clone().multiplyScalar(_).cross(S!==0||w!==0?new jt.Vector3(0,0,1):new jt.Vector3(0,1,0)).applyAxisAngle(v.normalize(),b).add(new jt.Vector3().addVectors(g,m).divideScalar(2));x=new jt.QuadraticBezierCurve3(g,M,m)}else{let S=_*70,w=-b,v=w+Math.PI/2;x=new jt.CubicBezierCurve3(g,new jt.Vector3(S*Math.cos(v),S*Math.sin(v),0).add(g),new jt.Vector3(S*Math.cos(w),S*Math.sin(w),0).add(g),m)}u.__curve=x}}}function i(){let s=te(e.linkDirectionalArrowRelPos),o=te(e.linkDirectionalArrowLength),a=te(e.nodeVal);e.arrowDataMapper.entries().forEach(([c,l])=>{if(!l)return;let h=t?c:e.layout.getLinkPosition(e.layout.graph.getLink(c.source,c.target).id),u=h[t?"source":"from"],d=h[t?"target":"to"];if(!u||!d||!u.hasOwnProperty("x")||!d.hasOwnProperty("x"))return;let f=Math.cbrt(Math.max(0,a(u)||1))*e.nodeRelSize,p=Math.cbrt(Math.max(0,a(d)||1))*e.nodeRelSize,_=o(c),g=s(c),m=c.__curve?v=>c.__curve.getPoint(v):v=>{let M=(U,P,k,C)=>P[U]+(k[U]-P[U])*C||0;return{x:M("x",u,d,v),y:M("y",u,d,v),z:M("z",u,d,v)}},y=c.__curve?c.__curve.getLength():Math.sqrt(["x","y","z"].map(v=>Math.pow((d[v]||0)-(u[v]||0),2)).reduce((v,M)=>v+M,0)),x=f+_+(y-f-p-_)*g,b=m(x/y),S=m((x-_)/y);["x","y","z"].forEach(v=>l.position[v]=S[v]);let w=new jt.Vector3(...["x","y","z"].map(v=>b[v]));l.parent.localToWorld(w),l.lookAt(w)})}function r(){let s=te(e.linkDirectionalParticleSpeed),o=te(e.linkDirectionalParticleOffset);e.graphData.links.forEach(a=>{let c=e.particlesDataMapper.getObj(a),l=c&&c.children,h=a.__singleHopPhotonsObj&&a.__singleHopPhotonsObj.children;if((!h||!h.length)&&(!l||!l.length))return;let u=t?a:e.layout.getLinkPosition(e.layout.graph.getLink(a.source,a.target).id),d=u[t?"source":"from"],f=u[t?"target":"to"];if(!d||!f||!d.hasOwnProperty("x")||!f.hasOwnProperty("x"))return;let p=s(a),_=Math.abs(o(a)),g=a.__curve?y=>a.__curve.getPoint(y):y=>{let x=(b,S,w,v)=>S[b]+(w[b]-S[b])*v||0;return{x:x("x",d,f,y),y:x("y",d,f,y),z:x("z",d,f,y)}};[...l||[],...h||[]].forEach((y,x)=>{let b=y.parent.__linkThreeObjType==="singleHopPhotons";if(y.hasOwnProperty("__progressRatio")||(y.__progressRatio=b?p<0?1:0:(x+_)/l.length),y.__progressRatio+=p,y.__progressRatio>=1||y.__progressRatio<0)if(!b)y.__progressRatio=y.__progressRatio%1,y.__progressRatio<0&&y.__progressRatio++;else{y.parent.remove(y),uv(y);return}let S=y.__progressRatio,w=g(S);y.geometry.type!=="SphereGeometry"&&y.lookAt(w.x,w.y,w.z),["x","y","z"].forEach(v=>y.position[v]=w[v])})})}},emitParticle:function(e,t){if(t&&e.graphData.links.includes(t)){if(!t.__singleHopPhotonsObj){let i=new jt.Group;i.__linkThreeObjType="singleHopPhotons",t.__singleHopPhotonsObj=i,e.graphScene.add(i)}let n=te(e.linkDirectionalParticleThreeObject)(t);if(n&&e.linkDirectionalParticleThreeObject===n&&(n=n.clone()),!n){let i=te(e.linkDirectionalParticleWidth),r=Math.ceil(i(t)*10)/10/2,s=e.linkDirectionalParticleResolution,o=new jt.SphereGeometry(r,s,s),a=te(e.linkColor),l=te(e.linkDirectionalParticleColor)(t)||a(t)||"#f0f0f0",h=new jt.Color(Ja(l)),u=e.linkOpacity*3,d=new jt.MeshLambertMaterial({color:h,transparent:!0,opacity:u});n=new jt.Mesh(o,d)}t.__singleHopPhotonsObj.add(n)}return this},getGraphBbox:function(e,t=()=>!0){if(!e.initialised)return null;let n=(function i(r){let s=[];if(r.geometry){r.geometry.computeBoundingBox();let o=new jt.Box3;o.copy(r.geometry.boundingBox).applyMatrix4(r.matrixWorld),s.push(o)}return s.concat(...(r.children||[]).filter(o=>!o.hasOwnProperty("__graphObjType")||o.__graphObjType==="node"&&t(o.__data)).map(i))})(e.graphScene);return n.length?Object.assign(...["x","y","z"].map(i=>({[i]:[_y(n,r=>r.min[i]),gy(n,r=>r.max[i])]}))):null}},stateInit:()=>({d3ForceLayout:za().force("link",Oa()).force("charge",Ga()).force("center",wd()).force("dagRadial",null).stop(),engineRunning:!1}),init(e,t){t.graphScene=e,t.nodeDataMapper=new vs(e,{objBindAttr:"__threeObj"}),t.linkDataMapper=new vs(e,{objBindAttr:"__lineObj"}),t.arrowDataMapper=new vs(e,{objBindAttr:"__arrowObj"}),t.particlesDataMapper=new vs(e,{objBindAttr:"__photonsObj"})},update(e,t){let n=i=>i.some(r=>t.hasOwnProperty(r));if(e.engineRunning=!1,typeof e.onUpdate=="function"&&e.onUpdate(),e.nodeAutoColorBy!==null&&n(["nodeAutoColorBy","graphData","nodeColor"])&&fv(e.graphData.nodes,te(e.nodeAutoColorBy),e.nodeColor),e.linkAutoColorBy!==null&&n(["linkAutoColorBy","graphData","linkColor"])&&fv(e.graphData.links,te(e.linkAutoColorBy),e.linkColor),e._flushObjects||n(["graphData","nodeThreeObject","nodeThreeObjectExtend","nodeVal","nodeColor","nodeVisibility","nodeRelSize","nodeResolution","nodeOpacity"])){let i=te(e.nodeThreeObject),r=te(e.nodeThreeObjectExtend),s=te(e.nodeVal),o=te(e.nodeColor),a=te(e.nodeVisibility),c={},l={};(e._flushObjects||n(["nodeThreeObject","nodeThreeObjectExtend"]))&&e.nodeDataMapper.clear(),e.nodeDataMapper.onCreateObj(h=>{let u=i(h),d=r(h);u&&e.nodeThreeObject===u&&(u=u.clone());let f;return u&&!d?f=u:(f=new jt.Mesh,f.__graphDefaultObj=!0,u&&d&&f.add(u)),f.__graphObjType="node",f}).onUpdateObj((h,u)=>{if(h.__graphDefaultObj){let d=s(u)||1,f=Math.cbrt(d)*e.nodeRelSize,p=e.nodeResolution;(!h.geometry.type.match(/^Sphere(Buffer)?Geometry$/)||h.geometry.parameters.radius!==f||h.geometry.parameters.widthSegments!==p)&&(c.hasOwnProperty(d)||(c[d]=new jt.SphereGeometry(f,p,p)),h.geometry.dispose(),h.geometry=c[d]);let _=o(u),g=new jt.Color(Ja(_||"#ffffaa")),m=e.nodeOpacity*pp(_);(h.material.type!=="MeshLambertMaterial"||!h.material.color.equals(g)||h.material.opacity!==m)&&(l.hasOwnProperty(_)||(l[_]=new jt.MeshLambertMaterial({color:g,transparent:!0,opacity:m})),h.material.dispose(),h.material=l[_])}}).digest(e.graphData.nodes.filter(a))}if(e._flushObjects||n(["graphData","linkThreeObject","linkThreeObjectExtend","linkMaterial","linkColor","linkWidth","linkVisibility","linkResolution","linkOpacity","linkDirectionalArrowLength","linkDirectionalArrowColor","linkDirectionalArrowResolution","linkDirectionalParticles","linkDirectionalParticleWidth","linkDirectionalParticleColor","linkDirectionalParticleResolution","linkDirectionalParticleThreeObject"])){let i=te(e.linkThreeObject),r=te(e.linkThreeObjectExtend),s=te(e.linkMaterial),o=te(e.linkVisibility),a=te(e.linkColor),c=te(e.linkWidth),l={},h={},u={},d=e.graphData.links.filter(o);if((e._flushObjects||n(["linkThreeObject","linkThreeObjectExtend","linkWidth"]))&&e.linkDataMapper.clear(),e.linkDataMapper.onRemoveObj(f=>{let p=f.__data&&f.__data.__singleHopPhotonsObj;p&&(p.parent.remove(p),uv(p),delete f.__data.__singleHopPhotonsObj)}).onCreateObj(f=>{let p=i(f),_=r(f);p&&e.linkThreeObject===p&&(p=p.clone());let g;if(!p||_)if(!!c(f))g=new jt.Mesh;else{let x=new jt.BufferGeometry;x[mp]("position",new jt.BufferAttribute(new Float32Array(6),3)),g=new jt.Line(x)}let m;return p?_?(m=new jt.Group,m.__graphDefaultObj=!0,m.add(g),m.add(p)):m=p:(m=g,m.__graphDefaultObj=!0),m.renderOrder=10,m.__graphObjType="link",m}).onUpdateObj((f,p)=>{if(f.__graphDefaultObj){let _=f.children.length?f.children[0]:f,g=Math.ceil(c(p)*10)/10,m=!!g;if(m){let x=g/2,b=e.linkResolution;if(!_.geometry.type.match(/^Cylinder(Buffer)?Geometry$/)||_.geometry.parameters.radiusTop!==x||_.geometry.parameters.radialSegments!==b){if(!l.hasOwnProperty(g)){let S=new jt.CylinderGeometry(x,x,1,b,1,!1);S[eu](new jt.Matrix4().makeTranslation(0,1/2,0)),S[eu](new jt.Matrix4().makeRotationX(Math.PI/2)),l[g]=S}_.geometry.dispose(),_.geometry=l[g]}}let y=s(p);if(y)_.material=y;else{let x=a(p),b=new jt.Color(Ja(x||"#f0f0f0")),S=e.linkOpacity*pp(x),w=m?"MeshLambertMaterial":"LineBasicMaterial";if(_.material.type!==w||!_.material.color.equals(b)||_.material.opacity!==S){let v=m?h:u;v.hasOwnProperty(x)||(v[x]=new jt[w]({color:b,transparent:S<1,opacity:S,depthWrite:S>=1})),_.material.dispose(),_.material=v[x]}}}}).digest(d),e.linkDirectionalArrowLength||t.hasOwnProperty("linkDirectionalArrowLength")){let f=te(e.linkDirectionalArrowLength),p=te(e.linkDirectionalArrowColor);e.arrowDataMapper.onCreateObj(()=>{let _=new jt.Mesh(void 0,new jt.MeshLambertMaterial({transparent:!0}));return _.__linkThreeObjType="arrow",_}).onUpdateObj((_,g)=>{let m=f(g),y=e.linkDirectionalArrowResolution;if(!_.geometry.type.match(/^Cone(Buffer)?Geometry$/)||_.geometry.parameters.height!==m||_.geometry.parameters.radialSegments!==y){let b=new jt.ConeGeometry(m*.25,m,y);b.translate(0,m/2,0),b.rotateX(Math.PI/2),_.geometry.dispose(),_.geometry=b}let x=p(g)||a(g)||"#f0f0f0";_.material.color=new jt.Color(Ja(x)),_.material.opacity=e.linkOpacity*3*pp(x)}).digest(d.filter(f))}if(e.linkDirectionalParticles||t.hasOwnProperty("linkDirectionalParticles")){let f=te(e.linkDirectionalParticles),p=te(e.linkDirectionalParticleWidth),_=te(e.linkDirectionalParticleColor),g=te(e.linkDirectionalParticleThreeObject),m={},y={};e.particlesDataMapper.onCreateObj(()=>{let x=new jt.Group;return x.__linkThreeObjType="photons",x.__photonDataMapper=new vs(x),x}).onUpdateObj((x,b)=>{let S=!!x.children.length&&x.children[0],w=g(b),v,M;if(w)v=w.geometry,M=w.material;else{let P=Math.ceil(p(b)*10)/10/2,k=e.linkDirectionalParticleResolution;S&&S.geometry.parameters.radius===P&&S.geometry.parameters.widthSegments===k?v=S.geometry:(y.hasOwnProperty(P)||(y[P]=new jt.SphereGeometry(P,k,k)),v=y[P]);let C=_(b)||a(b)||"#f0f0f0",N=new jt.Color(Ja(C)),T=e.linkOpacity*3;S&&S.material.color.equals(N)&&S.material.opacity===T?M=S.material:(m.hasOwnProperty(C)||(m[C]=new jt.MeshLambertMaterial({color:N,transparent:!0,opacity:T})),M=m[C])}S&&(S.geometry!==v&&S.geometry.dispose(),S.material!==M&&S.material.dispose());let U=Math.round(Math.abs(f(b)));x.__photonDataMapper.id(P=>P.idx).onCreateObj(()=>new jt.Mesh(v,M)).onUpdateObj(P=>{P.geometry=v,P.material=M}).digest([...new Array(U)].map((P,k)=>({idx:k})))}).digest(d.filter(f))}}if(e._flushObjects=!1,n(["graphData","nodeId","linkSource","linkTarget","numDimensions","forceEngine","dagMode","dagNodeFilter","dagLevelDistance"])){e.engineRunning=!1,e.graphData.links.forEach(s=>{s.source=s[e.linkSource],s.target=s[e.linkTarget]});let i=e.forceEngine!=="ngraph",r;if(i){(r=e.d3ForceLayout).stop().alpha(1).numDimensions(e.numDimensions).nodes(e.graphData.nodes);let s=e.d3ForceLayout.force("link");s&&s.id(l=>l[e.nodeId]).links(e.graphData.links);let o=e.dagMode&&FC(e.graphData,l=>l[e.nodeId],{nodeFilter:e.dagNodeFilter,onLoopError:e.onDagError||void 0}),a=Math.max(...Object.values(o||[])),c=e.dagLevelDistance||e.graphData.nodes.length/(a||1)*UC*(["radialin","radialout"].indexOf(e.dagMode)!==-1?.7:1);if(["lr","rl","td","bu","zin","zout"].includes(t.dagMode)){let l=["lr","rl"].includes(t.dagMode)?"fx":["td","bu"].includes(t.dagMode)?"fy":"fz";e.graphData.nodes.filter(e.dagNodeFilter).forEach(h=>delete h[l])}if(["lr","rl","td","bu","zin","zout"].includes(e.dagMode)){let l=["rl","td","zout"].includes(e.dagMode),h=d=>(o[d[e.nodeId]]-a/2)*c*(l?-1:1),u=["lr","rl"].includes(e.dagMode)?"fx":["td","bu"].includes(e.dagMode)?"fy":"fz";e.graphData.nodes.filter(e.dagNodeFilter).forEach(d=>d[u]=h(d))}e.d3ForceLayout.force("dagRadial",["radialin","radialout"].indexOf(e.dagMode)!==-1?Nd(l=>{let h=o[l[e.nodeId]]||-1;return(e.dagMode==="radialin"?a-h:h)*c}).strength(l=>e.dagNodeFilter(l)?1:0):null)}else{let s=dv.graph();e.graphData.nodes.forEach(o=>{s.addNode(o[e.nodeId])}),e.graphData.links.forEach(o=>{s.addLink(o.source,o.target)}),r=dv.forcelayout(s,{dimensions:e.numDimensions,...e.ngraphPhysics}),r.graph=s}for(let s=0;s<e.warmupTicks&&!(i&&e.d3AlphaMin>0&&e.d3ForceLayout.alpha()<e.d3AlphaMin);s++)r[i?"tick":"step"]();e.layout=r,this.resetCountdown()}e.engineRunning=!0,e.onFinishUpdate()}});function BC(e,t=Object,n=!1){class i extends t{constructor(...o){super(...o),this.__kapsuleInstance=new e(...n?[this]:[],...o)}}let r=e();return r._destructor?.(),Object.keys(r).forEach(s=>i.prototype[s]=function(...o){let a=this.__kapsuleInstance[s](...o);return a===this.__kapsuleInstance?this:a}),i}var zC=window.THREE?window.THREE:{Group:In},_p=BC(kC,zC.Group,!0);var nu=class{};var yp={type:"change"},xp={type:"start"},Mp={type:"end"},iu=1e-6,pe={NONE:-1,ROTATE:0,ZOOM:1,PAN:2,TOUCH_ROTATE:3,TOUCH_ZOOM_PAN:4},ru=new ut,Br=new ut,GC=new O,su=new O,vp=new O,zr=new ze,ou=new O,au=new O,bp=new O,cu=new O,lu=class extends jn{constructor(t,n=null){super(t,n),this.screen={left:0,top:0,width:0,height:0},this.rotateSpeed=1,this.zoomSpeed=1.2,this.panSpeed=.3,this.rollSpeed=1,this.noRotate=!1,this.noZoom=!1,this.noPan=!1,this.multiTouchRoll=!1,this.staticMoving=!1,this.dynamicDampingFactor=.2,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.keys=["KeyA","KeyS","KeyD"],this.mouseButtons={LEFT:ke.ROTATE,MIDDLE:ke.DOLLY,RIGHT:ke.PAN},this.target=new O,this.state=pe.NONE,this.keyState=pe.NONE,this._lastPosition=new O,this._lastUp=new O,this._lastZoom=1,this._touchZoomDistanceStart=0,this._touchZoomDistanceEnd=0,this._touchRollAngle=0,this._touchRollPointerIds="",this._lastAngle=0,this._lastRollAngle=0,this._eye=new O,this._movePrev=new ut,this._moveCurr=new ut,this._lastAxis=new O,this._zoomStart=new ut,this._zoomEnd=new ut,this._panStart=new ut,this._panEnd=new ut,this._pointers=[],this._pointerPositions={},this._onPointerMove=HC.bind(this),this._onPointerDown=VC.bind(this),this._onPointerUp=WC.bind(this),this._onPointerCancel=$C.bind(this),this._onContextMenu=JC.bind(this),this._onMouseWheel=KC.bind(this),this._onKeyDown=qC.bind(this),this._onKeyUp=jC.bind(this),this._onTouchStart=QC.bind(this),this._onTouchMove=tR.bind(this),this._onTouchEnd=eR.bind(this),this._onMouseDown=XC.bind(this),this._onMouseMove=YC.bind(this),this._onMouseUp=ZC.bind(this),this._target0=this.target.clone(),this._position0=this.object.position.clone(),this._up0=this.object.up.clone(),this._zoom0=this.object.zoom,n!==null&&(this.connect(n),this.handleResize()),this.update()}connect(t){super.connect(t),window.addEventListener("keydown",this._onKeyDown),window.addEventListener("keyup",this._onKeyUp),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerCancel),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction="none"}disconnect(){window.removeEventListener("keydown",this._onKeyDown),window.removeEventListener("keyup",this._onKeyUp),this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerCancel),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction=""}dispose(){this.disconnect()}handleResize(){let t=this.domElement.getBoundingClientRect(),n=this.domElement.ownerDocument.documentElement;this.screen.left=t.left+window.pageXOffset-n.clientLeft,this.screen.top=t.top+window.pageYOffset-n.clientTop,this.screen.width=t.width,this.screen.height=t.height}update(){if(this._eye.subVectors(this.object.position,this.target),this.noRotate||(this._rotateCamera(),this.multiTouchRoll===!0&&this._rollCamera()),this.noZoom||this._zoomCamera(),this.noPan||this._panCamera(),this.object.position.addVectors(this.target,this._eye),this.object.isPerspectiveCamera){this._checkDistances(),this.object.lookAt(this.target);let t=this._lastPosition.distanceToSquared(this.object.position)>iu,n=this._lastUp.distanceToSquared(this.object.up)>iu;(t||n)&&(this.dispatchEvent(yp),this._lastPosition.copy(this.object.position),this._lastUp.copy(this.object.up))}else if(this.object.isOrthographicCamera){this.object.lookAt(this.target);let t=this._lastPosition.distanceToSquared(this.object.position)>iu,n=this._lastUp.distanceToSquared(this.object.up)>iu,i=this._lastZoom!==this.object.zoom;(t||n||i)&&(this.dispatchEvent(yp),this._lastPosition.copy(this.object.position),this._lastUp.copy(this.object.up),this._lastZoom=this.object.zoom)}else console.warn("THREE.TrackballControls: Unsupported camera type.")}reset(){this.state=pe.NONE,this.keyState=pe.NONE,this.target.copy(this._target0),this.object.position.copy(this._position0),this.object.up.copy(this._up0),this.object.zoom=this._zoom0,this.object.updateProjectionMatrix(),this._eye.subVectors(this.object.position,this.target),this.object.lookAt(this.target),this.dispatchEvent(yp),this._lastPosition.copy(this.object.position),this._lastUp.copy(this.object.up),this._lastZoom=this.object.zoom}_panCamera(){if(Br.copy(this._panEnd).sub(this._panStart),Br.lengthSq()){if(this.object.isOrthographicCamera){let t=(this.object.right-this.object.left)/this.object.zoom/this.domElement.clientWidth,n=(this.object.top-this.object.bottom)/this.object.zoom/this.domElement.clientWidth;Br.x*=t,Br.y*=n}Br.multiplyScalar(this._eye.length()*this.panSpeed),su.copy(this._eye).cross(this.object.up).setLength(Br.x),su.add(GC.copy(this.object.up).setLength(Br.y)),this.object.position.add(su),this.target.add(su),this.staticMoving?this._panStart.copy(this._panEnd):this._panStart.add(Br.subVectors(this._panEnd,this._panStart).multiplyScalar(this.dynamicDampingFactor))}}_rotateCamera(){cu.set(this._moveCurr.x-this._movePrev.x,this._moveCurr.y-this._movePrev.y,0);let t=cu.length();t?(this._eye.copy(this.object.position).sub(this.target),ou.copy(this._eye).normalize(),au.copy(this.object.up).normalize(),bp.crossVectors(au,ou).normalize(),au.setLength(this._moveCurr.y-this._movePrev.y),bp.setLength(this._moveCurr.x-this._movePrev.x),cu.copy(au.add(bp)),vp.crossVectors(cu,this._eye).normalize(),t*=this.rotateSpeed,zr.setFromAxisAngle(vp,t),this._eye.applyQuaternion(zr),this.object.up.applyQuaternion(zr),this._lastAxis.copy(vp),this._lastAngle=t):!this.staticMoving&&this._lastAngle&&(this._lastAngle*=Math.sqrt(1-this.dynamicDampingFactor),this._eye.copy(this.object.position).sub(this.target),zr.setFromAxisAngle(this._lastAxis,this._lastAngle),this._eye.applyQuaternion(zr),this.object.up.applyQuaternion(zr)),this._movePrev.copy(this._moveCurr)}_rollCamera(){let t=this._getTouchRollAngle();if(t)this._lastRollAngle=t*this.rollSpeed;else if(!this.staticMoving&&this._lastRollAngle)this._lastRollAngle*=Math.sqrt(1-this.dynamicDampingFactor);else return;ou.copy(this._eye).normalize(),zr.setFromAxisAngle(ou,this._lastRollAngle),this.object.up.applyQuaternion(zr)}_getTouchRollAngle(){let t=this._pointers[0],n=this._pointers[1];if(n===void 0||t.pointerType!=="touch"||n.pointerType!=="touch")return this._touchRollPointerIds="",0;let i=`${t.pointerId},${n.pointerId}`,r=this._pointerPositions[t.pointerId],s=this._pointerPositions[n.pointerId],o=Math.atan2(s.y-r.y,s.x-r.x);if(i!==this._touchRollPointerIds)return this._touchRollPointerIds=i,this._touchRollAngle=o,0;let a=o-this._touchRollAngle;return this._touchRollAngle=o,a>Math.PI?a-=2*Math.PI:a<-Math.PI&&(a+=2*Math.PI),a}_zoomCamera(){let t;this.state===pe.TOUCH_ZOOM_PAN?(t=this._touchZoomDistanceStart/this._touchZoomDistanceEnd,this._touchZoomDistanceStart=this._touchZoomDistanceEnd,this.object.isPerspectiveCamera?this._eye.multiplyScalar(t):this.object.isOrthographicCamera?(this.object.zoom=be.clamp(this.object.zoom/t,this.minZoom,this.maxZoom),this._lastZoom!==this.object.zoom&&this.object.updateProjectionMatrix()):console.warn("THREE.TrackballControls: Unsupported camera type")):(t=1+(this._zoomEnd.y-this._zoomStart.y)*this.zoomSpeed,t!==1&&t>0&&(this.object.isPerspectiveCamera?this._eye.multiplyScalar(t):this.object.isOrthographicCamera?(this.object.zoom=be.clamp(this.object.zoom/t,this.minZoom,this.maxZoom),this._lastZoom!==this.object.zoom&&this.object.updateProjectionMatrix()):console.warn("THREE.TrackballControls: Unsupported camera type")),this.staticMoving?this._zoomStart.copy(this._zoomEnd):this._zoomStart.y+=(this._zoomEnd.y-this._zoomStart.y)*this.dynamicDampingFactor)}_getMouseOnScreen(t,n){return ru.set((t-this.screen.left)/this.screen.width,(n-this.screen.top)/this.screen.height),ru}_getMouseOnCircle(t,n){return ru.set((t-this.screen.width*.5-this.screen.left)/(this.screen.width*.5),(this.screen.height+2*(this.screen.top-n))/this.screen.width),ru}_addPointer(t){this._pointers.push(t)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n].pointerId==t.pointerId){this._pointers.splice(n,1);return}}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new ut,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let n=t.pointerId===this._pointers[0].pointerId?this._pointers[1]:this._pointers[0];return this._pointerPositions[n.pointerId]}_checkDistances(){(!this.noZoom||!this.noPan)&&(this._eye.lengthSq()>this.maxDistance*this.maxDistance&&(this.object.position.addVectors(this.target,this._eye.setLength(this.maxDistance)),this._zoomStart.copy(this._zoomEnd)),this._eye.lengthSq()<this.minDistance*this.minDistance&&(this.object.position.addVectors(this.target,this._eye.setLength(this.minDistance)),this._zoomStart.copy(this._zoomEnd)))}};function VC(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e))}function HC(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function WC(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchEnd(e):this._onMouseUp(),this._removePointer(e),this._pointers.length===0&&(this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp)))}function $C(e){this._removePointer(e)}function jC(){this.enabled!==!1&&(this.keyState=pe.NONE,window.addEventListener("keydown",this._onKeyDown))}function qC(e){this.enabled!==!1&&(window.removeEventListener("keydown",this._onKeyDown),this.keyState===pe.NONE&&(e.code===this.keys[pe.ROTATE]&&!this.noRotate?this.keyState=pe.ROTATE:e.code===this.keys[pe.ZOOM]&&!this.noZoom?this.keyState=pe.ZOOM:e.code===this.keys[pe.PAN]&&!this.noPan&&(this.keyState=pe.PAN)))}function XC(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ke.DOLLY:this.state=pe.ZOOM;break;case ke.ROTATE:this.state=pe.ROTATE;break;case ke.PAN:this.state=pe.PAN;break;default:this.state=pe.NONE}let n=this.keyState!==pe.NONE?this.keyState:this.state;n===pe.ROTATE&&!this.noRotate?(this._moveCurr.copy(this._getMouseOnCircle(e.pageX,e.pageY)),this._movePrev.copy(this._moveCurr)):n===pe.ZOOM&&!this.noZoom?(this._zoomStart.copy(this._getMouseOnScreen(e.pageX,e.pageY)),this._zoomEnd.copy(this._zoomStart)):n===pe.PAN&&!this.noPan&&(this._panStart.copy(this._getMouseOnScreen(e.pageX,e.pageY)),this._panEnd.copy(this._panStart)),this.dispatchEvent(xp)}function YC(e){let t=this.keyState!==pe.NONE?this.keyState:this.state;t===pe.ROTATE&&!this.noRotate?this._moveCurr.copy(this._getMouseOnCircle(e.pageX,e.pageY)):t===pe.ZOOM&&!this.noZoom?this._zoomEnd.copy(this._getMouseOnScreen(e.pageX,e.pageY)):t===pe.PAN&&!this.noPan&&this._panEnd.copy(this._getMouseOnScreen(e.pageX,e.pageY))}function ZC(){this.state=pe.NONE,this.dispatchEvent(Mp)}function KC(e){if(this.enabled!==!1&&this.noZoom!==!0){switch(e.preventDefault(),e.deltaMode){case 2:this._zoomStart.y-=e.deltaY*.025;break;case 1:this._zoomStart.y-=e.deltaY*.01;break;default:this._zoomStart.y-=e.deltaY*25e-5;break}this.dispatchEvent(xp),this.dispatchEvent(Mp)}}function JC(e){this.enabled!==!1&&e.preventDefault()}function QC(e){if(this._trackPointer(e),this._pointers.length===1)this.state=pe.TOUCH_ROTATE,this._moveCurr.copy(this._getMouseOnCircle(this._pointers[0].pageX,this._pointers[0].pageY)),this._movePrev.copy(this._moveCurr);else{this.state=pe.TOUCH_ZOOM_PAN;let t=this._pointers[0].pageX-this._pointers[1].pageX,n=this._pointers[0].pageY-this._pointers[1].pageY;this._touchZoomDistanceEnd=this._touchZoomDistanceStart=Math.sqrt(t*t+n*n);let i=(this._pointers[0].pageX+this._pointers[1].pageX)/2,r=(this._pointers[0].pageY+this._pointers[1].pageY)/2;this._panStart.copy(this._getMouseOnScreen(i,r)),this._panEnd.copy(this._panStart)}this.dispatchEvent(xp)}function tR(e){if(this._trackPointer(e),this._pointers.length===1)this._moveCurr.copy(this._getMouseOnCircle(e.pageX,e.pageY));else{let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y;this._touchZoomDistanceEnd=Math.sqrt(n*n+i*i);let r=(e.pageX+t.x)/2,s=(e.pageY+t.y)/2;this._panEnd.copy(this._getMouseOnScreen(r,s))}}function eR(e){switch(this._pointers.length){case 0:this.state=pe.NONE;break;case 1:this.state=pe.TOUCH_ROTATE,this._moveCurr.copy(this._getMouseOnCircle(e.pageX,e.pageY)),this._movePrev.copy(this._moveCurr);break;case 2:this.state=pe.TOUCH_ZOOM_PAN;for(let t=0;t<this._pointers.length;t++)if(this._pointers[t].pointerId!==e.pointerId){let n=this._pointerPositions[this._pointers[t].pointerId];this._moveCurr.copy(this._getMouseOnCircle(n.x,n.y)),this._movePrev.copy(this._moveCurr);break}break}this.dispatchEvent(Mp)}var zt={IDLE:Symbol(),ROTATE:Symbol(),PAN:Symbol(),SCALE:Symbol(),FOV:Symbol(),FOCUS:Symbol(),ZROTATE:Symbol(),TOUCH_MULTI:Symbol(),ANIMATION_FOCUS:Symbol(),ANIMATION_ROTATE:Symbol()},xe={NONE:Symbol(),ONE_FINGER:Symbol(),ONE_FINGER_SWITCHED:Symbol(),TWO_FINGER:Symbol(),MULT_FINGER:Symbol(),CURSOR:Symbol()},Qt={x:0,y:0},Yn={camera:new Vt,gizmos:new Vt},Ce={type:"change"},Mi={type:"start"},oi={type:"end"},nR=new er,Ve=new O,gv=new Vt,_v=new Vt,xi=new O,hu=1e-6,uu=class extends jn{constructor(t,n=null,i=null){super(t,n),this.scene=i,this.target=new O,this._currentTarget=new O,this.radiusFactor=.67,this.mouseActions=[],this._mouseOp=null,this._v2_1=new ut,this._v3_1=new O,this._v3_2=new O,this._m4_1=new Vt,this._m4_2=new Vt,this._quat=new ze,this._translationMatrix=new Vt,this._rotationMatrix=new Vt,this._scaleMatrix=new Vt,this._rotationAxis=new O,this._cameraMatrixState=new Vt,this._cameraProjectionState=new Vt,this._fovState=1,this._upState=new O,this._zoomState=1,this._nearPos=0,this._farPos=0,this._gizmoMatrixState=new Vt,this._up0=new O,this._zoom0=1,this._fov0=0,this._initialNear=0,this._nearPos0=0,this._initialFar=0,this._farPos0=0,this._cameraMatrixState0=new Vt,this._gizmoMatrixState0=new Vt,this._target0=new O,this._button=-1,this._touchStart=[],this._touchCurrent=[],this._input=xe.NONE,this._switchSensibility=32,this._startFingerDistance=0,this._currentFingerDistance=0,this._startFingerRotation=0,this._currentFingerRotation=0,this._devPxRatio=0,this._downValid=!0,this._nclicks=0,this._downEvents=[],this._downStart=0,this._clickStart=0,this._maxDownTime=250,this._maxInterval=300,this._posThreshold=24,this._movementThreshold=24,this._currentCursorPosition=new O,this._startCursorPosition=new O,this._grid=null,this._gridPosition=new O,this._gizmos=new In,this._curvePts=128,this._timeStart=-1,this._animationId=-1,this.focusAnimationTime=500,this._timePrev=0,this._timeCurrent=0,this._anglePrev=0,this._angleCurrent=0,this._cursorPosPrev=new O,this._cursorPosCurr=new O,this._wPrev=0,this._wCurr=0,this.adjustNearFar=!1,this.scaleFactor=1.1,this.dampingFactor=25,this.wMax=20,this.enableAnimations=!0,this.enableGrid=!1,this.cursorZoom=!1,this.minFov=5,this.maxFov=90,this.rotateSpeed=1,this.enablePan=!0,this.enableRotate=!0,this.enableZoom=!0,this.enableGizmos=!0,this.enableFocus=!0,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this._tbRadius=1,this._state=zt.IDLE,this.setCamera(t),this.scene!=null&&this.scene.add(this._gizmos),this.initializeMouseActions(),this._onContextMenu=rR.bind(this),this._onWheel=lR.bind(this),this._onPointerUp=cR.bind(this),this._onPointerMove=aR.bind(this),this._onPointerDown=oR.bind(this),this._onPointerCancel=sR.bind(this),this._onWindowResize=iR.bind(this),n!==null&&this.connect(n)}connect(t){super.connect(t),this._devPxRatio=window.devicePixelRatio,this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onWheel,{passive:!1}),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerCancel),window.addEventListener("resize",this._onWindowResize),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointercancel",this._onPointerCancel),this.domElement.removeEventListener("wheel",this._onWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerup",this._onPointerUp),window.removeEventListener("resize",this._onWindowResize),this.domElement.style.touchAction=""}onSinglePanStart(t,n){if(this.enabled)switch(this.dispatchEvent(Mi),this.setCenter(t.clientX,t.clientY),n){case"PAN":if(!this.enablePan)return;this._animationId!=-1&&(cancelAnimationFrame(this._animationId),this._animationId=-1,this._timeStart=-1,this.activateGizmos(!1),this.dispatchEvent(Ce)),this.updateTbState(zt.PAN,!0),this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement)),this.enableGrid&&(this.drawGrid(),this.dispatchEvent(Ce));break;case"ROTATE":if(!this.enableRotate)return;this._animationId!=-1&&(cancelAnimationFrame(this._animationId),this._animationId=-1,this._timeStart=-1),this.updateTbState(zt.ROTATE,!0),this._startCursorPosition.copy(this.unprojectOnTbSurface(this.object,Qt.x,Qt.y,this.domElement,this._tbRadius)),this.activateGizmos(!0),this.enableAnimations&&(this._timePrev=this._timeCurrent=performance.now(),this._angleCurrent=this._anglePrev=0,this._cursorPosPrev.copy(this._startCursorPosition),this._cursorPosCurr.copy(this._cursorPosPrev),this._wCurr=0,this._wPrev=this._wCurr),this.dispatchEvent(Ce);break;case"FOV":if(!this.object.isPerspectiveCamera||!this.enableZoom)return;this._animationId!=-1&&(cancelAnimationFrame(this._animationId),this._animationId=-1,this._timeStart=-1,this.activateGizmos(!1),this.dispatchEvent(Ce)),this.updateTbState(zt.FOV,!0),this._startCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5),this._currentCursorPosition.copy(this._startCursorPosition);break;case"ZOOM":if(!this.enableZoom)return;this._animationId!=-1&&(cancelAnimationFrame(this._animationId),this._animationId=-1,this._timeStart=-1,this.activateGizmos(!1),this.dispatchEvent(Ce)),this.updateTbState(zt.SCALE,!0),this._startCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5),this._currentCursorPosition.copy(this._startCursorPosition);break}}onSinglePanMove(t,n){if(this.enabled){let i=n!=this._state;switch(this.setCenter(t.clientX,t.clientY),n){case zt.PAN:this.enablePan&&(i?(this.dispatchEvent(oi),this.dispatchEvent(Mi),this.updateTbState(n,!0),this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement)),this.enableGrid&&this.drawGrid(),this.activateGizmos(!1)):(this._currentCursorPosition.copy(this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement)),this.applyTransformMatrix(this.pan(this._startCursorPosition,this._currentCursorPosition))));break;case zt.ROTATE:if(this.enableRotate)if(i)this.dispatchEvent(oi),this.dispatchEvent(Mi),this.updateTbState(n,!0),this._startCursorPosition.copy(this.unprojectOnTbSurface(this.object,Qt.x,Qt.y,this.domElement,this._tbRadius)),this.enableGrid&&this.disposeGrid(),this.activateGizmos(!0);else{this._currentCursorPosition.copy(this.unprojectOnTbSurface(this.object,Qt.x,Qt.y,this.domElement,this._tbRadius));let r=this._startCursorPosition.distanceTo(this._currentCursorPosition),s=this._startCursorPosition.angleTo(this._currentCursorPosition),o=Math.max(r/this._tbRadius,s)*this.rotateSpeed;this.applyTransformMatrix(this.rotate(this.calculateRotationAxis(this._startCursorPosition,this._currentCursorPosition),o)),this.enableAnimations&&(this._timePrev=this._timeCurrent,this._timeCurrent=performance.now(),this._anglePrev=this._angleCurrent,this._angleCurrent=o,this._cursorPosPrev.copy(this._cursorPosCurr),this._cursorPosCurr.copy(this._currentCursorPosition),this._wPrev=this._wCurr,this._wCurr=this.calculateAngularSpeed(this._anglePrev,this._angleCurrent,this._timePrev,this._timeCurrent))}break;case zt.SCALE:if(this.enableZoom)if(i)this.dispatchEvent(oi),this.dispatchEvent(Mi),this.updateTbState(n,!0),this._startCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5),this._currentCursorPosition.copy(this._startCursorPosition),this.enableGrid&&this.disposeGrid(),this.activateGizmos(!1);else{this._currentCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5);let s=this._currentCursorPosition.y-this._startCursorPosition.y,o=1;s<0?o=1/Math.pow(this.scaleFactor,-s*8):s>0&&(o=Math.pow(this.scaleFactor,s*8)),this._v3_1.setFromMatrixPosition(this._gizmoMatrixState),this.applyTransformMatrix(this.scale(o,this._v3_1))}break;case zt.FOV:if(this.enableZoom&&this.object.isPerspectiveCamera)if(i)this.dispatchEvent(oi),this.dispatchEvent(Mi),this.updateTbState(n,!0),this._startCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5),this._currentCursorPosition.copy(this._startCursorPosition),this.enableGrid&&this.disposeGrid(),this.activateGizmos(!1);else{this._currentCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5);let s=this._currentCursorPosition.y-this._startCursorPosition.y,o=1;s<0?o=1/Math.pow(this.scaleFactor,-s*8):s>0&&(o=Math.pow(this.scaleFactor,s*8)),this._v3_1.setFromMatrixPosition(this._cameraMatrixState);let a=this._v3_1.distanceTo(this._gizmos.position),c=a/o;c=be.clamp(c,this.minDistance,this.maxDistance);let l=a*Math.tan(be.DEG2RAD*this._fovState*.5),h=be.RAD2DEG*(Math.atan(l/c)*2);h=be.clamp(h,this.minFov,this.maxFov);let u=l/Math.tan(be.DEG2RAD*(h/2));o=a/u,this._v3_2.setFromMatrixPosition(this._gizmoMatrixState),this.setFov(h),this.applyTransformMatrix(this.scale(o,this._v3_2,!1)),Ve.copy(this._gizmos.position).sub(this.object.position).normalize().multiplyScalar(u/a),this._m4_1.makeTranslation(Ve.x,Ve.y,Ve.z)}break}this.dispatchEvent(Ce)}}onSinglePanEnd(){if(this._state==zt.ROTATE){if(!this.enableRotate)return;if(this.enableAnimations)if(performance.now()-this._timeCurrent<120){let n=Math.abs((this._wPrev+this._wCurr)/2),i=this;this._animationId=window.requestAnimationFrame(function(r){i.updateTbState(zt.ANIMATION_ROTATE,!0);let s=i.calculateRotationAxis(i._cursorPosPrev,i._cursorPosCurr);i.onRotationAnim(r,s,Math.min(n,i.wMax))})}else this.updateTbState(zt.IDLE,!1),this.activateGizmos(!1),this.dispatchEvent(Ce);else this.updateTbState(zt.IDLE,!1),this.activateGizmos(!1),this.dispatchEvent(Ce)}else(this._state==zt.PAN||this._state==zt.IDLE)&&(this.updateTbState(zt.IDLE,!1),this.enableGrid&&this.disposeGrid(),this.activateGizmos(!1),this.dispatchEvent(Ce));this.dispatchEvent(oi)}onDoubleTap(t){if(this.enabled&&this.enablePan&&this.enableFocus&&this.scene!=null){this.dispatchEvent(Mi),this.setCenter(t.clientX,t.clientY);let n=this.unprojectOnObj(this.getCursorNDC(Qt.x,Qt.y,this.domElement),this.object);if(n!=null&&this.enableAnimations){let i=this;this._animationId!=-1&&window.cancelAnimationFrame(this._animationId),this._timeStart=-1,this._animationId=window.requestAnimationFrame(function(r){i.updateTbState(zt.ANIMATION_FOCUS,!0),i.onFocusAnim(r,n,i._cameraMatrixState,i._gizmoMatrixState)})}else n!=null&&!this.enableAnimations&&(this.updateTbState(zt.FOCUS,!0),this.focus(n,this.scaleFactor),this.updateTbState(zt.IDLE,!1),this.dispatchEvent(Ce))}this.dispatchEvent(oi)}onDoublePanStart(){this.enabled&&this.enablePan&&(this.dispatchEvent(Mi),this.updateTbState(zt.PAN,!0),this.setCenter((this._touchCurrent[0].clientX+this._touchCurrent[1].clientX)/2,(this._touchCurrent[0].clientY+this._touchCurrent[1].clientY)/2),this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement,!0)),this._currentCursorPosition.copy(this._startCursorPosition),this.activateGizmos(!1))}onDoublePanMove(){this.enabled&&this.enablePan&&(this.setCenter((this._touchCurrent[0].clientX+this._touchCurrent[1].clientX)/2,(this._touchCurrent[0].clientY+this._touchCurrent[1].clientY)/2),this._state!=zt.PAN&&(this.updateTbState(zt.PAN,!0),this._startCursorPosition.copy(this._currentCursorPosition)),this._currentCursorPosition.copy(this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement,!0)),this.applyTransformMatrix(this.pan(this._startCursorPosition,this._currentCursorPosition,!0)),this.dispatchEvent(Ce))}onDoublePanEnd(){this.updateTbState(zt.IDLE,!1),this.dispatchEvent(oi)}onRotateStart(){this.enabled&&this.enableRotate&&(this.dispatchEvent(Mi),this.updateTbState(zt.ZROTATE,!0),this._startFingerRotation=this.getAngle(this._touchCurrent[1],this._touchCurrent[0])+this.getAngle(this._touchStart[1],this._touchStart[0]),this._currentFingerRotation=this._startFingerRotation,this.object.getWorldDirection(this._rotationAxis),!this.enablePan&&!this.enableZoom&&this.activateGizmos(!0))}onRotateMove(){if(this.enabled&&this.enableRotate){this.setCenter((this._touchCurrent[0].clientX+this._touchCurrent[1].clientX)/2,(this._touchCurrent[0].clientY+this._touchCurrent[1].clientY)/2);let t;this._state!=zt.ZROTATE&&(this.updateTbState(zt.ZROTATE,!0),this._startFingerRotation=this._currentFingerRotation),this._currentFingerRotation=this.getAngle(this._touchCurrent[1],this._touchCurrent[0])+this.getAngle(this._touchStart[1],this._touchStart[0]),this.enablePan?(this._v3_2.setFromMatrixPosition(this._gizmoMatrixState),t=this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1/this.object.zoom).add(this._v3_2)):t=new O().setFromMatrixPosition(this._gizmoMatrixState);let n=be.DEG2RAD*(this._startFingerRotation-this._currentFingerRotation);this.applyTransformMatrix(this.zRotate(t,n)),this.dispatchEvent(Ce)}}onRotateEnd(){this.updateTbState(zt.IDLE,!1),this.activateGizmos(!1),this.dispatchEvent(oi)}onPinchStart(){this.enabled&&this.enableZoom&&(this.dispatchEvent(Mi),this.updateTbState(zt.SCALE,!0),this._startFingerDistance=this.calculatePointersDistance(this._touchCurrent[0],this._touchCurrent[1]),this._currentFingerDistance=this._startFingerDistance,this.activateGizmos(!1))}onPinchMove(){if(this.enabled&&this.enableZoom){this.setCenter((this._touchCurrent[0].clientX+this._touchCurrent[1].clientX)/2,(this._touchCurrent[0].clientY+this._touchCurrent[1].clientY)/2);let t=12;this._state!=zt.SCALE&&(this._startFingerDistance=this._currentFingerDistance,this.updateTbState(zt.SCALE,!0)),this._currentFingerDistance=Math.max(this.calculatePointersDistance(this._touchCurrent[0],this._touchCurrent[1]),t*this._devPxRatio);let n=this._currentFingerDistance/this._startFingerDistance,i;this.enablePan?this.object.isOrthographicCamera?i=this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1/this.object.zoom).add(this._gizmos.position):this.object.isPerspectiveCamera&&(i=this.unprojectOnTbPlane(this.object,Qt.x,Qt.y,this.domElement).applyQuaternion(this.object.quaternion).add(this._gizmos.position)):i=this._gizmos.position,this.applyTransformMatrix(this.scale(n,i)),this.dispatchEvent(Ce)}}onPinchEnd(){this.updateTbState(zt.IDLE,!1),this.dispatchEvent(oi)}onTriplePanStart(){if(this.enabled&&this.enableZoom){this.dispatchEvent(Mi),this.updateTbState(zt.SCALE,!0);let t=0,n=0,i=this._touchCurrent.length;for(let r=0;r<i;r++)t+=this._touchCurrent[r].clientX,n+=this._touchCurrent[r].clientY;this.setCenter(t/i,n/i),this._startCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5),this._currentCursorPosition.copy(this._startCursorPosition)}}onTriplePanMove(){if(this.enabled&&this.enableZoom){let t=0,n=0,i=this._touchCurrent.length;for(let d=0;d<i;d++)t+=this._touchCurrent[d].clientX,n+=this._touchCurrent[d].clientY;this.setCenter(t/i,n/i);let r=8;this._currentCursorPosition.setY(this.getCursorNDC(Qt.x,Qt.y,this.domElement).y*.5);let s=this._currentCursorPosition.y-this._startCursorPosition.y,o=1;s<0?o=1/Math.pow(this.scaleFactor,-s*r):s>0&&(o=Math.pow(this.scaleFactor,s*r)),this._v3_1.setFromMatrixPosition(this._cameraMatrixState);let a=this._v3_1.distanceTo(this._gizmos.position),c=a/o;c=be.clamp(c,this.minDistance,this.maxDistance);let l=a*Math.tan(be.DEG2RAD*this._fovState*.5),h=be.RAD2DEG*(Math.atan(l/c)*2);h=be.clamp(h,this.minFov,this.maxFov);let u=l/Math.tan(be.DEG2RAD*(h/2));o=a/u,this._v3_2.setFromMatrixPosition(this._gizmoMatrixState),this.setFov(h),this.applyTransformMatrix(this.scale(o,this._v3_2,!1)),Ve.copy(this._gizmos.position).sub(this.object.position).normalize().multiplyScalar(u/a),this._m4_1.makeTranslation(Ve.x,Ve.y,Ve.z),this.dispatchEvent(Ce)}}onTriplePanEnd(){this.updateTbState(zt.IDLE,!1),this.dispatchEvent(oi)}setCenter(t,n){Qt.x=t,Qt.y=n}initializeMouseActions(){this.setMouseAction("PAN",0,"CTRL"),this.setMouseAction("PAN",2),this.setMouseAction("ROTATE",0),this.setMouseAction("ZOOM","WHEEL"),this.setMouseAction("ZOOM",1),this.setMouseAction("FOV","WHEEL","SHIFT"),this.setMouseAction("FOV",1,"SHIFT")}compareMouseAction(t,n){return t.operation==n.operation?t.mouse==n.mouse&&t.key==n.key:!1}setMouseAction(t,n,i=null){let r=["PAN","ROTATE","ZOOM","FOV"],s=[0,1,2,"WHEEL"],o=["CTRL","SHIFT",null],a;if(!r.includes(t)||!s.includes(n)||!o.includes(i)||n=="WHEEL"&&t!="ZOOM"&&t!="FOV")return!1;switch(t){case"PAN":a=zt.PAN;break;case"ROTATE":a=zt.ROTATE;break;case"ZOOM":a=zt.SCALE;break;case"FOV":a=zt.FOV;break}let c={operation:t,mouse:n,key:i,state:a};for(let l=0;l<this.mouseActions.length;l++)if(this.mouseActions[l].mouse==c.mouse&&this.mouseActions[l].key==c.key)return this.mouseActions.splice(l,1,c),!0;return this.mouseActions.push(c),!0}unsetMouseAction(t,n=null){for(let i=0;i<this.mouseActions.length;i++)if(this.mouseActions[i].mouse==t&&this.mouseActions[i].key==n)return this.mouseActions.splice(i,1),!0;return!1}getOpFromAction(t,n){let i;for(let r=0;r<this.mouseActions.length;r++)if(i=this.mouseActions[r],i.mouse==t&&i.key==n)return i.operation;if(n!=null){for(let r=0;r<this.mouseActions.length;r++)if(i=this.mouseActions[r],i.mouse==t&&i.key==null)return i.operation}return null}getOpStateFromAction(t,n){let i;for(let r=0;r<this.mouseActions.length;r++)if(i=this.mouseActions[r],i.mouse==t&&i.key==n)return i.state;if(n!=null){for(let r=0;r<this.mouseActions.length;r++)if(i=this.mouseActions[r],i.mouse==t&&i.key==null)return i.state}return null}getAngle(t,n){return Math.atan2(n.clientY-t.clientY,n.clientX-t.clientX)*180/Math.PI}updateTouchEvent(t){for(let n=0;n<this._touchCurrent.length;n++)if(this._touchCurrent[n].pointerId==t.pointerId){this._touchCurrent.splice(n,1,t);break}}applyTransformMatrix(t){if(t.camera!=null&&(this._m4_1.copy(this._cameraMatrixState).premultiply(t.camera),this._m4_1.decompose(this.object.position,this.object.quaternion,this.object.scale),this.object.updateMatrix(),(this._state==zt.ROTATE||this._state==zt.ZROTATE||this._state==zt.ANIMATION_ROTATE)&&this.object.up.copy(this._upState).applyQuaternion(this.object.quaternion)),t.gizmos!=null&&(this._m4_1.copy(this._gizmoMatrixState).premultiply(t.gizmos),this._m4_1.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this._gizmos.updateMatrix()),this._state==zt.SCALE||this._state==zt.FOCUS||this._state==zt.ANIMATION_FOCUS)if(this._tbRadius=this.calculateTbRadius(this.object),this.adjustNearFar){let n=this.object.position.distanceTo(this._gizmos.position),i=new dn;i.setFromObject(this._gizmos);let r=new pi;i.getBoundingSphere(r);let s=Math.max(this._nearPos0,r.radius+r.center.length()),o=n-this._initialNear,a=Math.min(s,o);this.object.near=n-a;let c=Math.min(this._farPos0,-r.radius+r.center.length()),l=n-this._initialFar,h=Math.min(c,l);this.object.far=n-h,this.object.updateProjectionMatrix()}else{let n=!1;this.object.near!=this._initialNear&&(this.object.near=this._initialNear,n=!0),this.object.far!=this._initialFar&&(this.object.far=this._initialFar,n=!0),n&&this.object.updateProjectionMatrix()}}calculateAngularSpeed(t,n,i,r){let s=n-t,o=(r-i)/1e3;return o==0?0:s/o}calculatePointersDistance(t,n){return Math.sqrt(Math.pow(n.clientX-t.clientX,2)+Math.pow(n.clientY-t.clientY,2))}calculateRotationAxis(t,n){return this._rotationMatrix.extractRotation(this._cameraMatrixState),this._quat.setFromRotationMatrix(this._rotationMatrix),this._rotationAxis.crossVectors(t,n).applyQuaternion(this._quat),this._rotationAxis.normalize().clone()}calculateTbRadius(t){let n=t.position.distanceTo(this._gizmos.position);if(t.type=="PerspectiveCamera"){let i=be.DEG2RAD*t.fov*.5,r=Math.atan(t.aspect*Math.tan(i));return Math.tan(Math.min(i,r))*n*this.radiusFactor}else if(t.type=="OrthographicCamera")return Math.min(t.top,t.right)*this.radiusFactor}focus(t,n,i=1){Ve.copy(t).sub(this._gizmos.position).multiplyScalar(i),this._translationMatrix.makeTranslation(Ve.x,Ve.y,Ve.z),gv.copy(this._gizmoMatrixState),this._gizmoMatrixState.premultiply(this._translationMatrix),this._gizmoMatrixState.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),_v.copy(this._cameraMatrixState),this._cameraMatrixState.premultiply(this._translationMatrix),this._cameraMatrixState.decompose(this.object.position,this.object.quaternion,this.object.scale),this.enableZoom&&this.applyTransformMatrix(this.scale(n,this._gizmos.position)),this._gizmoMatrixState.copy(gv),this._cameraMatrixState.copy(_v)}drawGrid(){if(this.scene!=null){let i,r,s,o;if(this.object.isOrthographicCamera){let a=this.object.right-this.object.left,c=this.object.bottom-this.object.top;s=Math.max(a,c),o=s/20,i=s/this.object.zoom*3,r=i/o*this.object.zoom}else if(this.object.isPerspectiveCamera){let a=this.object.position.distanceTo(this._gizmos.position),c=be.DEG2RAD*this.object.fov*.5,l=Math.atan(this.object.aspect*Math.tan(c));s=Math.tan(Math.max(c,l))*a*2,o=s/20,i=s*3,r=i/o}this._grid==null&&(this._grid=new ba(i,r,8947848,8947848),this._grid.position.copy(this._gizmos.position),this._gridPosition.copy(this._grid.position),this._grid.quaternion.copy(this.object.quaternion),this._grid.rotateX(Math.PI*.5),this.scene.add(this._grid))}}dispose(){this._animationId!=-1&&window.cancelAnimationFrame(this._animationId),this.disconnect(),this.scene!==null&&this.scene.remove(this._gizmos),this.disposeGrid()}disposeGrid(){this._grid!=null&&this.scene!=null&&(this.scene.remove(this._grid),this._grid=null)}easeOutCubic(t){return 1-Math.pow(1-t,3)}activateGizmos(t){let n=this._gizmos.children[0],i=this._gizmos.children[1],r=this._gizmos.children[2];t?(n.material.setValues({opacity:1}),i.material.setValues({opacity:1}),r.material.setValues({opacity:1})):(n.material.setValues({opacity:.6}),i.material.setValues({opacity:.6}),r.material.setValues({opacity:.6}))}getCursorNDC(t,n,i){let r=i.getBoundingClientRect();return this._v2_1.setX((t-r.left)/r.width*2-1),this._v2_1.setY((r.bottom-n)/r.height*2-1),this._v2_1.clone()}getCursorPosition(t,n,i){return this._v2_1.copy(this.getCursorNDC(t,n,i)),this._v2_1.x*=(this.object.right-this.object.left)*.5,this._v2_1.y*=(this.object.top-this.object.bottom)*.5,this._v2_1.clone()}setCamera(t){t.lookAt(this.target),t.updateMatrix(),t.type=="PerspectiveCamera"&&(this._fov0=t.fov,this._fovState=t.fov),this._cameraMatrixState0.copy(t.matrix),this._cameraMatrixState.copy(this._cameraMatrixState0),this._cameraProjectionState.copy(t.projectionMatrix),this._zoom0=t.zoom,this._zoomState=this._zoom0,this._initialNear=t.near,this._nearPos0=t.position.distanceTo(this.target)-t.near,this._nearPos=this._initialNear,this._initialFar=t.far,this._farPos0=t.position.distanceTo(this.target)-t.far,this._farPos=this._initialFar,this._up0.copy(t.up),this._upState.copy(t.up),this.object=t,this.object.updateProjectionMatrix(),this._tbRadius=this.calculateTbRadius(t),this.makeGizmos(this.target,this._tbRadius)}setGizmosVisible(t){this._gizmos.visible=t,this.dispatchEvent(Ce)}setTbRadius(t){this.radiusFactor=t,this._tbRadius=this.calculateTbRadius(this.object);let i=new Ri(0,0,this._tbRadius,this._tbRadius).getPoints(this._curvePts),r=new Ae().setFromPoints(i);for(let s in this._gizmos.children)this._gizmos.children[s].geometry=r;this.dispatchEvent(Ce)}makeGizmos(t,n){let r=new Ri(0,0,n,n).getPoints(this._curvePts),s=new Ae().setFromPoints(r),o=new Hn({color:16744576,fog:!1,transparent:!0,opacity:.6}),a=new Hn({color:8454016,fog:!1,transparent:!0,opacity:.6}),c=new Hn({color:8421631,fog:!1,transparent:!0,opacity:.6}),l=new Ci(s,o),h=new Ci(s,a),u=new Ci(s,c),d=Math.PI*.5;if(l.rotation.y=d,h.rotation.x=d,this._gizmoMatrixState0.identity().setPosition(t),this._gizmoMatrixState.copy(this._gizmoMatrixState0),this.object.zoom!==1){let f=1/this.object.zoom;this._scaleMatrix.makeScale(f,f,f),this._translationMatrix.makeTranslation(-t.x,-t.y,-t.z),this._gizmoMatrixState.premultiply(this._translationMatrix).premultiply(this._scaleMatrix),this._translationMatrix.makeTranslation(t.x,t.y,t.z),this._gizmoMatrixState.premultiply(this._translationMatrix)}this._gizmoMatrixState.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this._gizmos.traverse(function(f){f.isLine&&(f.geometry.dispose(),f.material.dispose())}),this._gizmos.clear(),this._gizmos.add(l),this._gizmos.add(h),this._gizmos.add(u)}onFocusAnim(t,n,i,r){if(this._timeStart==-1&&(this._timeStart=t),this._state==zt.ANIMATION_FOCUS){let o=(t-this._timeStart)/this.focusAnimationTime;if(this._gizmoMatrixState.copy(r),o>=1)this._gizmoMatrixState.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this.focus(n,this.scaleFactor),this._timeStart=-1,this.updateTbState(zt.IDLE,!1),this.activateGizmos(!1),this.dispatchEvent(Ce);else{let a=this.easeOutCubic(o),c=1-a+this.scaleFactor*a;this._gizmoMatrixState.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this.focus(n,c,a),this.dispatchEvent(Ce);let l=this;this._animationId=window.requestAnimationFrame(function(h){l.onFocusAnim(h,n,i,r.clone())})}}else this._animationId=-1,this._timeStart=-1}onRotationAnim(t,n,i){if(this._timeStart==-1&&(this._anglePrev=0,this._angleCurrent=0,this._timeStart=t),this._state==zt.ANIMATION_ROTATE){let r=(t-this._timeStart)/1e3;if(i+-this.dampingFactor*r>0){this._angleCurrent=.5*-this.dampingFactor*Math.pow(r,2)+i*r+0,this.applyTransformMatrix(this.rotate(n,this._angleCurrent)),this.dispatchEvent(Ce);let o=this;this._animationId=window.requestAnimationFrame(function(a){o.onRotationAnim(a,n,i)})}else this._animationId=-1,this._timeStart=-1,this.updateTbState(zt.IDLE,!1),this.activateGizmos(!1),this.dispatchEvent(Ce)}else this._animationId=-1,this._timeStart=-1,this._state!=zt.ROTATE&&(this.activateGizmos(!1),this.dispatchEvent(Ce))}pan(t,n,i=!1){let r=t.clone().sub(n);if(this.object.isOrthographicCamera)r.multiplyScalar(1/this.object.zoom);else if(this.object.isPerspectiveCamera&&i){this._v3_1.setFromMatrixPosition(this._cameraMatrixState0),this._v3_2.setFromMatrixPosition(this._gizmoMatrixState0);let s=this._v3_1.distanceTo(this._v3_2)/this.object.position.distanceTo(this._gizmos.position);r.multiplyScalar(1/s)}return this._v3_1.set(r.x,r.y,0).applyQuaternion(this.object.quaternion),this._m4_1.makeTranslation(this._v3_1.x,this._v3_1.y,this._v3_1.z),this.setTransformationMatrices(this._m4_1,this._m4_1),Yn}reset(){this.target.copy(this._target0),this.object.zoom=this._zoom0,this.object.isPerspectiveCamera&&(this.object.fov=this._fov0),this.object.near=this._nearPos,this.object.far=this._farPos,this._cameraMatrixState.copy(this._cameraMatrixState0),this._cameraMatrixState.decompose(this.object.position,this.object.quaternion,this.object.scale),this.object.up.copy(this._up0),this.object.updateMatrix(),this.object.updateProjectionMatrix(),this._gizmoMatrixState.copy(this._gizmoMatrixState0),this._gizmoMatrixState0.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this._gizmos.updateMatrix(),this._tbRadius=this.calculateTbRadius(this.object),this.makeGizmos(this._gizmos.position,this._tbRadius),this.object.lookAt(this._gizmos.position),this.updateTbState(zt.IDLE,!1),this.dispatchEvent(Ce)}rotate(t,n){let i=this._gizmos.position;return this._translationMatrix.makeTranslation(-i.x,-i.y,-i.z),this._rotationMatrix.makeRotationAxis(t,-n),this._m4_1.makeTranslation(i.x,i.y,i.z),this._m4_1.multiply(this._rotationMatrix),this._m4_1.multiply(this._translationMatrix),this.setTransformationMatrices(this._m4_1),Yn}copyState(){let t;this.object.isOrthographicCamera?t=JSON.stringify({arcballState:{cameraFar:this.object.far,cameraMatrix:this.object.matrix,cameraNear:this.object.near,cameraUp:this.object.up,cameraZoom:this.object.zoom,gizmoMatrix:this._gizmos.matrix,target:this.target}}):this.object.isPerspectiveCamera&&(t=JSON.stringify({arcballState:{cameraFar:this.object.far,cameraFov:this.object.fov,cameraMatrix:this.object.matrix,cameraNear:this.object.near,cameraUp:this.object.up,cameraZoom:this.object.zoom,gizmoMatrix:this._gizmos.matrix,target:this.target}})),navigator.clipboard.writeText(t)}pasteState(){let t=this;navigator.clipboard.readText().then(function(i){t.setStateFromJSON(i)})}saveState(){this.object.updateMatrix(),this._gizmos.updateMatrix(),this._target0.copy(this.target),this._cameraMatrixState0.copy(this.object.matrix),this._gizmoMatrixState0.copy(this._gizmos.matrix),this._nearPos=this.object.near,this._farPos=this.object.far,this._zoom0=this.object.zoom,this._up0.copy(this.object.up),this.object.isPerspectiveCamera&&(this._fov0=this.object.fov)}scale(t,n,i=!0){xi.copy(n);let r=1/t;if(this.object.isOrthographicCamera){this.object.zoom=this._zoomState,this.object.zoom*=t,this.object.zoom>this.maxZoom?(this.object.zoom=this.maxZoom,r=this._zoomState/this.maxZoom):this.object.zoom<this.minZoom&&(this.object.zoom=this.minZoom,r=this._zoomState/this.minZoom),this.object.updateProjectionMatrix(),this._v3_1.setFromMatrixPosition(this._gizmoMatrixState),this._scaleMatrix.makeScale(r,r,r),this._translationMatrix.makeTranslation(-this._v3_1.x,-this._v3_1.y,-this._v3_1.z),this._m4_2.makeTranslation(this._v3_1.x,this._v3_1.y,this._v3_1.z).multiply(this._scaleMatrix),this._m4_2.multiply(this._translationMatrix),xi.sub(this._v3_1);let s=xi.clone().multiplyScalar(r);return xi.sub(s),this._m4_1.makeTranslation(xi.x,xi.y,xi.z),this._m4_2.premultiply(this._m4_1),this.setTransformationMatrices(this._m4_1,this._m4_2),Yn}else if(this.object.isPerspectiveCamera){this._v3_1.setFromMatrixPosition(this._cameraMatrixState),this._v3_2.setFromMatrixPosition(this._gizmoMatrixState);let s=this._v3_1.distanceTo(xi),o=s-s*r,a=s-o;if(a<this.minDistance?(r=this.minDistance/s,o=s-s*r):a>this.maxDistance&&(r=this.maxDistance/s,o=s-s*r),Ve.copy(xi).sub(this._v3_1).normalize().multiplyScalar(o),this._m4_1.makeTranslation(Ve.x,Ve.y,Ve.z),i){let c=this._v3_2;s=c.distanceTo(xi),o=s-s*r,Ve.copy(xi).sub(this._v3_2).normalize().multiplyScalar(o),this._translationMatrix.makeTranslation(c.x,c.y,c.z),this._scaleMatrix.makeScale(r,r,r),this._m4_2.makeTranslation(Ve.x,Ve.y,Ve.z).multiply(this._translationMatrix),this._m4_2.multiply(this._scaleMatrix),this._translationMatrix.makeTranslation(-c.x,-c.y,-c.z),this._m4_2.multiply(this._translationMatrix),this.setTransformationMatrices(this._m4_1,this._m4_2)}else this.setTransformationMatrices(this._m4_1);return Yn}}setFov(t){this.object.isPerspectiveCamera&&(this.object.fov=be.clamp(t,this.minFov,this.maxFov),this.object.updateProjectionMatrix())}setTransformationMatrices(t=null,n=null){t!=null?Yn.camera!=null?Yn.camera.copy(t):Yn.camera=t.clone():Yn.camera=null,n!=null?Yn.gizmos!=null?Yn.gizmos.copy(n):Yn.gizmos=n.clone():Yn.gizmos=null}zRotate(t,n){return this._rotationMatrix.makeRotationAxis(this._rotationAxis,n),this._translationMatrix.makeTranslation(-t.x,-t.y,-t.z),this._m4_1.makeTranslation(t.x,t.y,t.z),this._m4_1.multiply(this._rotationMatrix),this._m4_1.multiply(this._translationMatrix),this._v3_1.setFromMatrixPosition(this._gizmoMatrixState).sub(t),this._v3_2.copy(this._v3_1).applyAxisAngle(this._rotationAxis,n),this._v3_2.sub(this._v3_1),this._m4_2.makeTranslation(this._v3_2.x,this._v3_2.y,this._v3_2.z),this.setTransformationMatrices(this._m4_1,this._m4_2),Yn}getRaycaster(){return nR}unprojectOnObj(t,n){let i=this.getRaycaster();i.near=n.near,i.far=n.far,i.setFromCamera(t,n);let r=i.intersectObjects(this.scene.children,!0);for(let s=0;s<r.length;s++)if(r[s].object.uuid!=this._gizmos.uuid&&r[s].face!=null)return r[s].point.clone();return null}unprojectOnTbSurface(t,n,i,r,s){if(t.type=="OrthographicCamera"){this._v2_1.copy(this.getCursorPosition(n,i,r)),this._v3_1.set(this._v2_1.x,this._v2_1.y,0);let o=Math.pow(this._v2_1.x,2),a=Math.pow(this._v2_1.y,2),c=Math.pow(this._tbRadius,2);return o+a<=c*.5?this._v3_1.setZ(Math.sqrt(c-(o+a))):this._v3_1.setZ(c*.5/Math.sqrt(o+a)),this._v3_1}else if(t.type=="PerspectiveCamera"){this._v2_1.copy(this.getCursorNDC(n,i,r)),this._v3_1.set(this._v2_1.x,this._v2_1.y,-1),this._v3_1.applyMatrix4(t.projectionMatrixInverse);let o=this._v3_1.clone().normalize(),a=t.position.distanceTo(this._gizmos.position),c=Math.pow(s,2),l=this._v3_1.z,h=Math.sqrt(Math.pow(this._v3_1.x,2)+Math.pow(this._v3_1.y,2));if(h==0)return o.set(this._v3_1.x,this._v3_1.y,s),o;let u=l/h,d=a,f=Math.pow(u,2)+1,p=2*u*d,_=Math.pow(d,2)-c,g=Math.pow(p,2)-4*f*_;if(g>=0&&(this._v2_1.setX((-p-Math.sqrt(g))/(2*f)),this._v2_1.setY(u*this._v2_1.x+d),be.RAD2DEG*this._v2_1.angle()>=45)){let x=Math.sqrt(Math.pow(this._v2_1.x,2)+Math.pow(a-this._v2_1.y,2));return o.multiplyScalar(x),o.z+=a,o}f=u,p=d,_=-c*.5,g=Math.pow(p,2)-4*f*_,this._v2_1.setX((-p-Math.sqrt(g))/(2*f)),this._v2_1.setY(u*this._v2_1.x+d);let m=Math.sqrt(Math.pow(this._v2_1.x,2)+Math.pow(a-this._v2_1.y,2));return o.multiplyScalar(m),o.z+=a,o}}unprojectOnTbPlane(t,n,i,r,s=!1){if(t.type=="OrthographicCamera")return this._v2_1.copy(this.getCursorPosition(n,i,r)),this._v3_1.set(this._v2_1.x,this._v2_1.y,0),this._v3_1.clone();if(t.type=="PerspectiveCamera"){this._v2_1.copy(this.getCursorNDC(n,i,r)),this._v3_1.set(this._v2_1.x,this._v2_1.y,-1),this._v3_1.applyMatrix4(t.projectionMatrixInverse);let o=this._v3_1.clone().normalize(),a=this._v3_1.z,c=Math.sqrt(Math.pow(this._v3_1.x,2)+Math.pow(this._v3_1.y,2)),l;if(s?l=this._v3_1.setFromMatrixPosition(this._cameraMatrixState0).distanceTo(this._v3_2.setFromMatrixPosition(this._gizmoMatrixState0)):l=t.position.distanceTo(this._gizmos.position),c==0)return o.set(0,0,0),o;let h=a/c,u=l,d=-u/h,f=Math.sqrt(Math.pow(u,2)+Math.pow(d,2));return o.multiplyScalar(f),o.z=0,o}}updateMatrixState(){this._cameraMatrixState.copy(this.object.matrix),this._gizmoMatrixState.copy(this._gizmos.matrix),this.object.isOrthographicCamera?(this._cameraProjectionState.copy(this.object.projectionMatrix),this.object.updateProjectionMatrix(),this._zoomState=this.object.zoom):this.object.isPerspectiveCamera&&(this._fovState=this.object.fov)}updateTbState(t,n){this._state=t,n&&this.updateMatrixState()}update(){if(this.target.equals(this._currentTarget)===!1&&(this._gizmos.position.copy(this.target),this._tbRadius=this.calculateTbRadius(this.object),this.makeGizmos(this.target,this._tbRadius),this._currentTarget.copy(this.target)),this.object.isOrthographicCamera){if(this.object.zoom>this.maxZoom||this.object.zoom<this.minZoom){let t=be.clamp(this.object.zoom,this.minZoom,this.maxZoom);this.applyTransformMatrix(this.scale(t/this.object.zoom,this._gizmos.position,!0))}}else if(this.object.isPerspectiveCamera){let t=this.object.position.distanceTo(this._gizmos.position);if(t>this.maxDistance+hu||t<this.minDistance-hu){let i=be.clamp(t,this.minDistance,this.maxDistance);this.applyTransformMatrix(this.scale(i/t,this._gizmos.position)),this.updateMatrixState()}(this.object.fov<this.minFov||this.object.fov>this.maxFov)&&(this.object.fov=be.clamp(this.object.fov,this.minFov,this.maxFov),this.object.updateProjectionMatrix());let n=this._tbRadius;if(this._tbRadius=this.calculateTbRadius(this.object),n<this._tbRadius-hu||n>this._tbRadius+hu){let i=(this._gizmos.scale.x+this._gizmos.scale.y+this._gizmos.scale.z)/3,r=this._tbRadius/i,o=new Ri(0,0,r,r).getPoints(this._curvePts),a=new Ae().setFromPoints(o);for(let c in this._gizmos.children)this._gizmos.children[c].geometry=a}}this.object.lookAt(this._gizmos.position)}setStateFromJSON(t){let n=JSON.parse(t);if(n.arcballState!=null){this.target.fromArray(n.arcballState.target),this._cameraMatrixState.fromArray(n.arcballState.cameraMatrix.elements),this._cameraMatrixState.decompose(this.object.position,this.object.quaternion,this.object.scale),this.object.up.copy(n.arcballState.cameraUp),this.object.near=n.arcballState.cameraNear,this.object.far=n.arcballState.cameraFar,this.object.zoom=n.arcballState.cameraZoom,this.object.isPerspectiveCamera&&(this.object.fov=n.arcballState.cameraFov),this._gizmoMatrixState.fromArray(n.arcballState.gizmoMatrix.elements),this._gizmoMatrixState.decompose(this._gizmos.position,this._gizmos.quaternion,this._gizmos.scale),this.object.updateMatrix(),this.object.updateProjectionMatrix(),this._gizmos.updateMatrix(),this._tbRadius=this.calculateTbRadius(this.object);let i=new Vt().copy(this._gizmoMatrixState0);this.makeGizmos(this._gizmos.position,this._tbRadius),this._gizmoMatrixState0.copy(i),this.object.lookAt(this._gizmos.position),this.updateTbState(zt.IDLE,!1),this.dispatchEvent(Ce)}}};function iR(){let e=(this._gizmos.scale.x+this._gizmos.scale.y+this._gizmos.scale.z)/3;this._tbRadius=this.calculateTbRadius(this.object);let t=this._tbRadius/e,i=new Ri(0,0,t,t).getPoints(this._curvePts),r=new Ae().setFromPoints(i);for(let s in this._gizmos.children)this._gizmos.children[s].geometry=r;this.dispatchEvent(Ce)}function rR(e){if(this.enabled){for(let t=0;t<this.mouseActions.length;t++)if(this.mouseActions[t].mouse==2){e.preventDefault();break}}}function sR(){this._touchStart.splice(0,this._touchStart.length),this._touchCurrent.splice(0,this._touchCurrent.length),this._input=xe.NONE}function oR(e){if(e.button==0&&e.isPrimary?(this._downValid=!0,this._downEvents.push(e),this._downStart=performance.now()):this._downValid=!1,e.pointerType=="touch"&&this._input!=xe.CURSOR)switch(this._touchStart.push(e),this._touchCurrent.push(e),this._input){case xe.NONE:this._input=xe.ONE_FINGER,this.onSinglePanStart(e,"ROTATE"),window.addEventListener("pointermove",this._onPointerMove),window.addEventListener("pointerup",this._onPointerUp);break;case xe.ONE_FINGER:case xe.ONE_FINGER_SWITCHED:this._input=xe.TWO_FINGER,this.onRotateStart(),this.onPinchStart(),this.onDoublePanStart();break;case xe.TWO_FINGER:this._input=xe.MULT_FINGER,this.onTriplePanStart(e);break}else if(e.pointerType!="touch"&&this._input==xe.NONE){let t=null;e.ctrlKey||e.metaKey?t="CTRL":e.shiftKey&&(t="SHIFT"),this._mouseOp=this.getOpFromAction(e.button,t),this._mouseOp!=null&&(window.addEventListener("pointermove",this._onPointerMove),window.addEventListener("pointerup",this._onPointerUp),this._input=xe.CURSOR,this._button=e.button,this.onSinglePanStart(e,this._mouseOp))}}function aR(e){if(e.pointerType=="touch"&&this._input!=xe.CURSOR)switch(this._input){case xe.ONE_FINGER:this.updateTouchEvent(e),this.onSinglePanMove(e,zt.ROTATE);break;case xe.ONE_FINGER_SWITCHED:if(this.calculatePointersDistance(this._touchCurrent[0],e)*this._devPxRatio>=this._switchSensibility){this._input=xe.ONE_FINGER,this.updateTouchEvent(e),this.onSinglePanStart(e,"ROTATE");break}break;case xe.TWO_FINGER:this.updateTouchEvent(e),this.onRotateMove(),this.onPinchMove(),this.onDoublePanMove();break;case xe.MULT_FINGER:this.updateTouchEvent(e),this.onTriplePanMove(e);break}else if(e.pointerType!="touch"&&this._input==xe.CURSOR){let t=null;e.ctrlKey||e.metaKey?t="CTRL":e.shiftKey&&(t="SHIFT");let n=this.getOpStateFromAction(this._button,t);n!=null&&this.onSinglePanMove(e,n)}this._downValid&&this.calculatePointersDistance(this._downEvents[this._downEvents.length-1],e)*this._devPxRatio>this._movementThreshold&&(this._downValid=!1)}function cR(e){if(e.pointerType=="touch"&&this._input!=xe.CURSOR){let t=this._touchCurrent.length;for(let n=0;n<t;n++)if(this._touchCurrent[n].pointerId==e.pointerId){this._touchCurrent.splice(n,1),this._touchStart.splice(n,1);break}switch(this._input){case xe.ONE_FINGER:case xe.ONE_FINGER_SWITCHED:window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerup",this._onPointerUp),this._input=xe.NONE,this.onSinglePanEnd();break;case xe.TWO_FINGER:this.onDoublePanEnd(e),this.onPinchEnd(e),this.onRotateEnd(e),this._input=xe.ONE_FINGER_SWITCHED;break;case xe.MULT_FINGER:this._touchCurrent.length==0&&(window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerup",this._onPointerUp),this._input=xe.NONE,this.onTriplePanEnd());break}}else e.pointerType!="touch"&&this._input==xe.CURSOR&&(window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerup",this._onPointerUp),this._input=xe.NONE,this.onSinglePanEnd(),this._button=-1);if(e.isPrimary)if(this._downValid)if(e.timeStamp-this._downEvents[this._downEvents.length-1].timeStamp<=this._maxDownTime)if(this._nclicks==0)this._nclicks=1,this._clickStart=performance.now();else{let n=e.timeStamp-this._clickStart,i=this.calculatePointersDistance(this._downEvents[1],this._downEvents[0])*this._devPxRatio;n<=this._maxInterval&&i<=this._posThreshold?(this._nclicks=0,this._downEvents.splice(0,this._downEvents.length),this.onDoubleTap(e)):(this._nclicks=1,this._downEvents.shift(),this._clickStart=performance.now())}else this._downValid=!1,this._nclicks=0,this._downEvents.splice(0,this._downEvents.length);else this._nclicks=0,this._downEvents.splice(0,this._downEvents.length)}function lR(e){if(this.enabled&&this.enableZoom){let t=null;e.ctrlKey||e.metaKey?t="CTRL":e.shiftKey&&(t="SHIFT");let n=this.getOpFromAction("WHEEL",t);if(n!=null){e.preventDefault(),this.dispatchEvent(Mi);let i=125,r=e.deltaY/i,s=1;switch(r>0?s=1/this.scaleFactor:r<0&&(s=this.scaleFactor),n){case"ZOOM":if(this.updateTbState(zt.SCALE,!0),r>0?s=1/Math.pow(this.scaleFactor,r):r<0&&(s=Math.pow(this.scaleFactor,-r)),this.cursorZoom&&this.enablePan){let o;this.object.isOrthographicCamera?o=this.unprojectOnTbPlane(this.object,e.clientX,e.clientY,this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1/this.object.zoom).add(this._gizmos.position):this.object.isPerspectiveCamera&&(o=this.unprojectOnTbPlane(this.object,e.clientX,e.clientY,this.domElement).applyQuaternion(this.object.quaternion).add(this._gizmos.position)),this.applyTransformMatrix(this.scale(s,o))}else this.applyTransformMatrix(this.scale(s,this._gizmos.position));this._grid!=null&&(this.disposeGrid(),this.drawGrid()),this.updateTbState(zt.IDLE,!1),this.dispatchEvent(Ce),this.dispatchEvent(oi);break;case"FOV":if(this.object.isPerspectiveCamera){this.updateTbState(zt.FOV,!0),e.deltaX!=0&&(r=e.deltaX/i,s=1,r>0?s=1/Math.pow(this.scaleFactor,r):r<0&&(s=Math.pow(this.scaleFactor,-r))),this._v3_1.setFromMatrixPosition(this._cameraMatrixState);let o=this._v3_1.distanceTo(this._gizmos.position),a=o/s;a=be.clamp(a,this.minDistance,this.maxDistance);let c=o*Math.tan(be.DEG2RAD*this.object.fov*.5),l=be.RAD2DEG*(Math.atan(c/a)*2);l>this.maxFov?l=this.maxFov:l<this.minFov&&(l=this.minFov);let h=c/Math.tan(be.DEG2RAD*(l/2));s=o/h,this.setFov(l),this.applyTransformMatrix(this.scale(s,this._gizmos.position,!1))}this._grid!=null&&(this.disposeGrid(),this.drawGrid()),this.updateTbState(zt.IDLE,!1),this.dispatchEvent(Ce),this.dispatchEvent(oi);break}}}}var yv={type:"change"},wp={type:"start"},bv={type:"end"},fu=new wr,vv=new xn,hR=Math.cos(70*be.DEG2RAD),qe=new O,On=2*Math.PI,me={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Sp=1e-6,du=class extends jn{constructor(t,n=null){super(t,n),this.state=me.NONE,this.target=new O,this.cursor=new O,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ke.ROTATE,MIDDLE:ke.DOLLY,RIGHT:ke.PAN},this.touches={ONE:ni.ROTATE,TWO:ni.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new O,this._lastQuaternion=new ze,this._lastTargetPosition=new O,this._quat=new ze().setFromUnitVectors(t.up,new O(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ao,this._sphericalDelta=new ao,this._scale=1,this._panOffset=new O,this._rotateStart=new ut,this._rotateEnd=new ut,this._rotateDelta=new ut,this._panStart=new ut,this._panEnd=new ut,this._panDelta=new ut,this._dollyStart=new ut,this._dollyEnd=new ut,this._dollyDelta=new ut,this._dollyDirection=new O,this._mouse=new ut,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=fR.bind(this),this._onPointerDown=uR.bind(this),this._onPointerUp=dR.bind(this),this._onContextMenu=bR.bind(this),this._onMouseWheel=gR.bind(this),this._onKeyDown=_R.bind(this),this._onTouchStart=yR.bind(this),this._onTouchMove=vR.bind(this),this._onMouseDown=pR.bind(this),this._onMouseMove=mR.bind(this),this._interceptControlDown=xR.bind(this),this._interceptControlUp=MR.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=me.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(yv),this.update(),this.state=me.NONE}pan(t,n){this._pan(t,n),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let n=this.object.position;qe.copy(n).sub(this.target),qe.applyQuaternion(this._quat),this._spherical.setFromVector3(qe),this.autoRotate&&this.state===me.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=On:i>Math.PI&&(i-=On),r<-Math.PI?r+=On:r>Math.PI&&(r-=On),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(qe.setFromSpherical(this._spherical),qe.applyQuaternion(this._quatInverse),n.copy(this.target).add(qe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=qe.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),s=!!c}else if(this.object.isOrthographicCamera){let a=new O(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=c!==this.object.zoom;let l=new O(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=qe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(fu.origin.copy(this.object.position),fu.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(fu.direction))<hR?this.object.lookAt(this.target):(vv.setFromNormalAndCoplanarPoint(this.object.up,this.target),fu.intersectPlane(vv,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Sp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Sp||this._lastTargetPosition.distanceToSquared(this.target)>Sp?(this.dispatchEvent(yv),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?On/60*this.autoRotateSpeed*t:On/60/60*this.autoRotateSpeed}_getZoomScale(t){let n=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,n){qe.setFromMatrixColumn(n,0),qe.multiplyScalar(-t),this._panOffset.add(qe)}_panUp(t,n){this.screenSpacePanning===!0?qe.setFromMatrixColumn(n,1):(qe.setFromMatrixColumn(n,0),qe.crossVectors(this.object.up,qe)),qe.multiplyScalar(t),this._panOffset.add(qe)}_pan(t,n){let i=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;qe.copy(r).sub(this.target);let s=qe.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/i.clientHeight,this.object.matrix),this._panUp(2*n*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),r=t-i.left,s=n-i.top,o=i.width,a=i.height;this._mouse.x=r/o*2-1,this._mouse.y=-(s/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientY),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(On*this._rotateDelta.x/n.clientHeight),this._rotateUp(On*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let n=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(On*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-On*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(On*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-On*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._panStart.set(i,r)}}_handleTouchStartDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,r=t.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),r=.5*(t.pageX+i.x),s=.5*(t.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(On*this._rotateDelta.x/n.clientHeight),this._rotateUp(On*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,r=t.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(t.pageX+n.x)*.5,a=(t.pageY+n.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(t){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId)return!0;return!1}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new ut,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let n=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(t){let n=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function uR(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function fR(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function dR(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(bv),this.state=me.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function pR(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ke.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=me.DOLLY;break;case ke.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=me.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=me.ROTATE}break;case ke.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=me.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=me.PAN}break;default:this.state=me.NONE}this.state!==me.NONE&&this.dispatchEvent(wp)}function mR(e){switch(this.state){case me.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case me.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case me.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function gR(e){this.enabled===!1||this.enableZoom===!1||this.state!==me.NONE||(e.preventDefault(),this.dispatchEvent(wp),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(bv))}function _R(e){this.enabled!==!1&&this._handleKeyDown(e)}function yR(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case ni.ROTATE:if(this.enableRotate===!1){this.state=me.NONE;break}this._handleTouchStartRotate(e),this.state=me.TOUCH_ROTATE;break;case ni.PAN:if(this.enablePan===!1){this.state=me.NONE;break}this._handleTouchStartPan(e),this.state=me.TOUCH_PAN;break;default:this.state=me.NONE}break;case 2:switch(this.touches.TWO){case ni.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=me.TOUCH_DOLLY_PAN;break;case ni.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=me.TOUCH_DOLLY_ROTATE;break;default:this.state=me.NONE}break;default:this.state=me.NONE}this.state!==me.NONE&&this.dispatchEvent(wp)}function vR(e){switch(this._trackPointer(e),this.state){case me.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case me.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case me.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case me.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=me.NONE}}function bR(e){this.enabled!==!1&&e.preventDefault()}function xR(e){e.key==="Control"&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function MR(e){e.key==="Control"&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var SR={type:"change"},xv=1e-6,Mv=new ze,pu=class extends jn{constructor(t,n=null){super(t,n),this.movementSpeed=1,this.rollSpeed=.005,this.dragToLook=!1,this.autoForward=!1,this._moveState={up:0,down:0,left:0,right:0,forward:0,back:0,pitchUp:0,pitchDown:0,yawLeft:0,yawRight:0,rollLeft:0,rollRight:0},this._moveVector=new O(0,0,0),this._rotationVector=new O(0,0,0),this._lastQuaternion=new ze,this._lastPosition=new O,this._status=0,this._onKeyDown=wR.bind(this),this._onKeyUp=ER.bind(this),this._onPointerMove=AR.bind(this),this._onPointerDown=TR.bind(this),this._onPointerUp=CR.bind(this),this._onPointerCancel=RR.bind(this),this._onContextMenu=PR.bind(this),n!==null&&this.connect(n)}connect(t){super.connect(t),window.addEventListener("keydown",this._onKeyDown),window.addEventListener("keyup",this._onKeyUp),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointerup",this._onPointerUp),this.domElement.addEventListener("pointercancel",this._onPointerCancel),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction="none"}disconnect(){window.removeEventListener("keydown",this._onKeyDown),window.removeEventListener("keyup",this._onKeyUp),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerCancel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.domElement.style.touchAction=""}dispose(){this.disconnect()}update(t){if(this.enabled===!1)return;let n=this.object,i=t*this.movementSpeed,r=t*this.rollSpeed;n.translateX(this._moveVector.x*i),n.translateY(this._moveVector.y*i),n.translateZ(this._moveVector.z*i),Mv.set(this._rotationVector.x*r,this._rotationVector.y*r,this._rotationVector.z*r,1).normalize(),n.quaternion.multiply(Mv),(this._lastPosition.distanceToSquared(n.position)>xv||8*(1-this._lastQuaternion.dot(n.quaternion))>xv)&&(this.dispatchEvent(SR),this._lastQuaternion.copy(n.quaternion),this._lastPosition.copy(n.position))}_updateMovementVector(){let t=this._moveState.forward||this.autoForward&&!this._moveState.back?1:0;this._moveVector.x=-this._moveState.left+this._moveState.right,this._moveVector.y=-this._moveState.down+this._moveState.up,this._moveVector.z=-t+this._moveState.back}_updateRotationVector(){this._rotationVector.x=-this._moveState.pitchDown+this._moveState.pitchUp,this._rotationVector.y=-this._moveState.yawRight+this._moveState.yawLeft,this._rotationVector.z=-this._moveState.rollRight+this._moveState.rollLeft}_getContainerDimensions(){return this.domElement!=document?{size:[this.domElement.offsetWidth,this.domElement.offsetHeight],offset:[this.domElement.offsetLeft,this.domElement.offsetTop]}:{size:[window.innerWidth,window.innerHeight],offset:[0,0]}}};function wR(e){if(!(e.altKey||this.enabled===!1)){switch(e.code){case"ShiftLeft":case"ShiftRight":this.movementSpeedMultiplier=.1;break;case"KeyW":this._moveState.forward=1;break;case"KeyS":this._moveState.back=1;break;case"KeyA":this._moveState.left=1;break;case"KeyD":this._moveState.right=1;break;case"KeyR":this._moveState.up=1;break;case"KeyF":this._moveState.down=1;break;case"ArrowUp":this._moveState.pitchUp=1;break;case"ArrowDown":this._moveState.pitchDown=1;break;case"ArrowLeft":this._moveState.yawLeft=1;break;case"ArrowRight":this._moveState.yawRight=1;break;case"KeyQ":this._moveState.rollLeft=1;break;case"KeyE":this._moveState.rollRight=1;break}this._updateMovementVector(),this._updateRotationVector()}}function ER(e){if(this.enabled!==!1){switch(e.code){case"ShiftLeft":case"ShiftRight":this.movementSpeedMultiplier=1;break;case"KeyW":this._moveState.forward=0;break;case"KeyS":this._moveState.back=0;break;case"KeyA":this._moveState.left=0;break;case"KeyD":this._moveState.right=0;break;case"KeyR":this._moveState.up=0;break;case"KeyF":this._moveState.down=0;break;case"ArrowUp":this._moveState.pitchUp=0;break;case"ArrowDown":this._moveState.pitchDown=0;break;case"ArrowLeft":this._moveState.yawLeft=0;break;case"ArrowRight":this._moveState.yawRight=0;break;case"KeyQ":this._moveState.rollLeft=0;break;case"KeyE":this._moveState.rollRight=0;break}this._updateMovementVector(),this._updateRotationVector()}}function TR(e){if(this.enabled!==!1)if(this.dragToLook)this._status++;else{switch(e.button){case 0:this._moveState.forward=1;break;case 2:this._moveState.back=1;break}this._updateMovementVector()}}function AR(e){if(this.enabled!==!1&&(!this.dragToLook||this._status>0)){let t=this._getContainerDimensions(),n=t.size[0]/2,i=t.size[1]/2;this._moveState.yawLeft=-(e.pageX-t.offset[0]-n)/n,this._moveState.pitchDown=(e.pageY-t.offset[1]-i)/i,this._updateRotationVector()}}function CR(e){if(this.enabled!==!1){if(this.dragToLook)this._status--,this._moveState.yawLeft=this._moveState.pitchDown=0;else{switch(e.button){case 0:this._moveState.forward=0;break;case 2:this._moveState.back=0;break}this._updateMovementVector()}this._updateRotationVector()}}function RR(){this.enabled!==!1&&(this.dragToLook?(this._status=0,this._moveState.yawLeft=this._moveState.pitchDown=0):(this._moveState.forward=0,this._moveState.back=0,this._updateMovementVector()),this._updateRotationVector())}function PR(e){this.enabled!==!1&&e.preventDefault()}var Sv={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var hr=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},IR=new ss(-1,1,1,-1,0,1),Ep=class extends Ae{constructor(){super(),this.setAttribute("position",new de([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new de([0,2,0,0,2,0],2))}},LR=new Ep,mu=class{constructor(t){this._mesh=new Ge(LR,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,IR)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var gu=class extends hr{constructor(t,n="tDiffuse"){super(),this.textureID=n,this.uniforms=null,this.material=null,t instanceof Wn?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Mh.clone(t.uniforms),this.material=new Wn({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new mu(this.material)}render(t,n,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(n),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var tc=class extends hr{constructor(t,n){super(),this.scene=t,this.camera=n,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,n,i){let r=t.getContext(),s=t.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,o,4294967295),s.buffers.stencil.setClear(a),s.buffers.stencil.setLocked(!0),t.setRenderTarget(i),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}},_u=class extends hr{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var yu=class{constructor(t,n){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),n===void 0){let i=t.getSize(new ut);this._width=i.width,this._height=i.height,n=new wn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:qn}),n.texture.name="EffectComposer.rt1"}else this._width=n.width,this._height=n.height;this.renderTarget1=n,this.renderTarget2=n.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new gu(Sv),this.copyPass.material.blending=nr,this.timer=new os}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,n){this.passes.splice(n,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let n=this.passes.indexOf(t);n!==-1&&this.passes.splice(n,1)}isLastEnabledPass(t){for(let n=t+1;n<this.passes.length;n++)if(this.passes[n].enabled)return!1;return!0}render(t){this.timer.update(),t===void 0&&(t=this.timer.getDelta());let n=this.renderer.getRenderTarget(),i=!1;for(let r=0,s=this.passes.length;r<s;r++){let o=this.passes[r];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,i),o.needsSwap){if(i){let a=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),c.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}tc!==void 0&&(o instanceof tc?i=!0:o instanceof _u&&(i=!1))}}this.renderer.setRenderTarget(n)}reset(t){if(t===void 0){let n=this.renderer.getSize(new ut);this._pixelRatio=this.renderer.getPixelRatio(),this._width=n.width,this._height=n.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,n){this._width=t,this._height=n;let i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,r)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var vu=class extends hr{constructor(t,n,i=null,r=null,s=null){super(),this.scene=t,this.camera=n,this.overrideMaterial=i,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Wt}render(t,n,i){let r=t.autoClear;t.autoClear=!1;let s,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(s=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=r}};function An(){return An=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var i in n)({}).hasOwnProperty.call(n,i)&&(e[i]=n[i])}return e},An.apply(null,arguments)}function wv(e){if(e===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function Gr(e,t){return Gr=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(n,i){return n.__proto__=i,n},Gr(e,t)}function Ev(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,Gr(e,t)}function bu(e){return bu=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},bu(e)}function Tv(e){try{return Function.toString.call(e).indexOf("[native code]")!==-1}catch{return typeof e=="function"}}function Tp(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(Tp=function(){return!!e})()}function Av(e,t,n){if(Tp())return Reflect.construct.apply(null,arguments);var i=[null];i.push.apply(i,t);var r=new(e.bind.apply(e,i));return n&&Gr(r,n.prototype),r}function xu(e){var t=typeof Map=="function"?new Map:void 0;return xu=function(i){if(i===null||!Tv(i))return i;if(typeof i!="function")throw new TypeError("Super expression must either be null or a function");if(t!==void 0){if(t.has(i))return t.get(i);t.set(i,r)}function r(){return Av(i,arguments,bu(this).constructor)}return r.prototype=Object.create(i.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),Gr(r,i)},xu(e)}var Fn=(function(e){Ev(t,e);function t(n){var i;if(1)i=e.call(this,"An error occurred. See https://github.com/styled-components/polished/blob/main/src/internalHelpers/errors.md#"+n+" for more information.")||this;else for(var r,s,o;o<r;o++);return wv(i)}return t})(xu(Error));function Cv(e,t){return e.substr(-t.length)===t}var DR=/^([+-]?(?:\d+|\d*\.\d+))([a-z]*|%)$/;function Rv(e){if(typeof e!="string")return e;var t=e.match(DR);return t?parseFloat(e):e}var NR=function(t){return function(n,i){i===void 0&&(i="16px");var r=n,s=i;if(typeof n=="string"){if(!Cv(n,"px"))throw new Fn(69,t,n);r=Rv(n)}if(typeof i=="string"){if(!Cv(i,"px"))throw new Fn(70,t,i);s=Rv(i)}if(typeof r=="string")throw new Fn(71,n,t);if(typeof s=="string")throw new Fn(72,i,t);return""+r/s+t}},Iv=NR,lk=Iv("em");var hk=Iv("rem");function Ap(e){return Math.round(e*255)}function OR(e,t,n){return Ap(e)+","+Ap(t)+","+Ap(n)}function ec(e,t,n,i){if(i===void 0&&(i=OR),t===0)return i(n,n,n);var r=(e%360+360)%360/60,s=(1-Math.abs(2*n-1))*t,o=s*(1-Math.abs(r%2-1)),a=0,c=0,l=0;r>=0&&r<1?(a=s,c=o):r>=1&&r<2?(a=o,c=s):r>=2&&r<3?(c=s,l=o):r>=3&&r<4?(c=o,l=s):r>=4&&r<5?(a=o,l=s):r>=5&&r<6&&(a=s,l=o);var h=n-s/2,u=a+h,d=c+h,f=l+h;return i(u,d,f)}var Pv={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"639",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"};function FR(e){if(typeof e!="string")return e;var t=e.toLowerCase();return Pv[t]?"#"+Pv[t]:e}var UR=/^#[a-fA-F0-9]{6}$/,kR=/^#[a-fA-F0-9]{8}$/,BR=/^#[a-fA-F0-9]{3}$/,zR=/^#[a-fA-F0-9]{4}$/,Cp=/^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i,GR=/^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i,VR=/^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i,HR=/^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;function Vr(e){if(typeof e!="string")throw new Fn(3);var t=FR(e);if(t.match(UR))return{red:parseInt(""+t[1]+t[2],16),green:parseInt(""+t[3]+t[4],16),blue:parseInt(""+t[5]+t[6],16)};if(t.match(kR)){var n=parseFloat((parseInt(""+t[7]+t[8],16)/255).toFixed(2));return{red:parseInt(""+t[1]+t[2],16),green:parseInt(""+t[3]+t[4],16),blue:parseInt(""+t[5]+t[6],16),alpha:n}}if(t.match(BR))return{red:parseInt(""+t[1]+t[1],16),green:parseInt(""+t[2]+t[2],16),blue:parseInt(""+t[3]+t[3],16)};if(t.match(zR)){var i=parseFloat((parseInt(""+t[4]+t[4],16)/255).toFixed(2));return{red:parseInt(""+t[1]+t[1],16),green:parseInt(""+t[2]+t[2],16),blue:parseInt(""+t[3]+t[3],16),alpha:i}}var r=Cp.exec(t);if(r)return{red:parseInt(""+r[1],10),green:parseInt(""+r[2],10),blue:parseInt(""+r[3],10)};var s=GR.exec(t.substring(0,50));if(s)return{red:parseInt(""+s[1],10),green:parseInt(""+s[2],10),blue:parseInt(""+s[3],10),alpha:parseFloat(""+s[4])>1?parseFloat(""+s[4])/100:parseFloat(""+s[4])};var o=VR.exec(t);if(o){var a=parseInt(""+o[1],10),c=parseInt(""+o[2],10)/100,l=parseInt(""+o[3],10)/100,h="rgb("+ec(a,c,l)+")",u=Cp.exec(h);if(!u)throw new Fn(4,t,h);return{red:parseInt(""+u[1],10),green:parseInt(""+u[2],10),blue:parseInt(""+u[3],10)}}var d=HR.exec(t.substring(0,50));if(d){var f=parseInt(""+d[1],10),p=parseInt(""+d[2],10)/100,_=parseInt(""+d[3],10)/100,g="rgb("+ec(f,p,_)+")",m=Cp.exec(g);if(!m)throw new Fn(4,t,g);return{red:parseInt(""+m[1],10),green:parseInt(""+m[2],10),blue:parseInt(""+m[3],10),alpha:parseFloat(""+d[4])>1?parseFloat(""+d[4])/100:parseFloat(""+d[4])}}throw new Fn(5)}function WR(e){var t=e.red/255,n=e.green/255,i=e.blue/255,r=Math.max(t,n,i),s=Math.min(t,n,i),o=(r+s)/2;if(r===s)return e.alpha!==void 0?{hue:0,saturation:0,lightness:o,alpha:e.alpha}:{hue:0,saturation:0,lightness:o};var a,c=r-s,l=o>.5?c/(2-r-s):c/(r+s);switch(r){case t:a=(n-i)/c+(n<i?6:0);break;case n:a=(i-t)/c+2;break;default:a=(t-n)/c+4;break}return a*=60,e.alpha!==void 0?{hue:a,saturation:l,lightness:o,alpha:e.alpha}:{hue:a,saturation:l,lightness:o}}function Hr(e){return WR(Vr(e))}var $R=function(t){return t.length===7&&t[1]===t[2]&&t[3]===t[4]&&t[5]===t[6]?"#"+t[1]+t[3]+t[5]:t},Pp=$R;function bs(e){var t=e.toString(16);return t.length===1?"0"+t:t}function Rp(e){return bs(Math.round(e*255))}function jR(e,t,n){return Pp("#"+Rp(e)+Rp(t)+Rp(n))}function Mu(e,t,n){return ec(e,t,n,jR)}function qR(e,t,n){if(typeof e=="number"&&typeof t=="number"&&typeof n=="number")return Mu(e,t,n);if(typeof e=="object"&&t===void 0&&n===void 0)return Mu(e.hue,e.saturation,e.lightness);throw new Fn(1)}function XR(e,t,n,i){if(typeof e=="number"&&typeof t=="number"&&typeof n=="number"&&typeof i=="number")return i>=1?Mu(e,t,n):"rgba("+ec(e,t,n)+","+i+")";if(typeof e=="object"&&t===void 0&&n===void 0&&i===void 0)return e.alpha>=1?Mu(e.hue,e.saturation,e.lightness):"rgba("+ec(e.hue,e.saturation,e.lightness)+","+e.alpha+")";throw new Fn(2)}function Ip(e,t,n){if(typeof e=="number"&&typeof t=="number"&&typeof n=="number")return Pp("#"+bs(e)+bs(t)+bs(n));if(typeof e=="object"&&t===void 0&&n===void 0)return Pp("#"+bs(e.red)+bs(e.green)+bs(e.blue));throw new Fn(6)}function Su(e,t,n,i){if(typeof e=="string"&&typeof t=="number"){var r=Vr(e);return"rgba("+r.red+","+r.green+","+r.blue+","+t+")"}else{if(typeof e=="number"&&typeof t=="number"&&typeof n=="number"&&typeof i=="number")return i>=1?Ip(e,t,n):"rgba("+e+","+t+","+n+","+i+")";if(typeof e=="object"&&t===void 0&&n===void 0&&i===void 0)return e.alpha>=1?Ip(e.red,e.green,e.blue):"rgba("+e.red+","+e.green+","+e.blue+","+e.alpha+")"}throw new Fn(7)}var YR=function(t){return typeof t.red=="number"&&typeof t.green=="number"&&typeof t.blue=="number"&&(typeof t.alpha!="number"||typeof t.alpha>"u")},ZR=function(t){return typeof t.red=="number"&&typeof t.green=="number"&&typeof t.blue=="number"&&typeof t.alpha=="number"},KR=function(t){return typeof t.hue=="number"&&typeof t.saturation=="number"&&typeof t.lightness=="number"&&(typeof t.alpha!="number"||typeof t.alpha>"u")},JR=function(t){return typeof t.hue=="number"&&typeof t.saturation=="number"&&typeof t.lightness=="number"&&typeof t.alpha=="number"};function Wr(e){if(typeof e!="object")throw new Fn(8);if(ZR(e))return Su(e);if(YR(e))return Ip(e);if(JR(e))return XR(e);if(KR(e))return qR(e);throw new Fn(8)}function Lv(e,t,n){return function(){var r=n.concat(Array.prototype.slice.call(arguments));return r.length>=t?e.apply(this,r):Lv(e,t,r)}}function Zn(e){return Lv(e,e.length,[])}function QR(e,t){if(t==="transparent")return t;var n=Hr(t);return Wr(An({},n,{hue:n.hue+parseFloat(e)}))}var uk=Zn(QR);function Ro(e,t,n){return Math.max(e,Math.min(t,n))}function t3(e,t){if(t==="transparent")return t;var n=Hr(t);return Wr(An({},n,{lightness:Ro(0,1,n.lightness-parseFloat(e))}))}var fk=Zn(t3);function e3(e,t){if(t==="transparent")return t;var n=Hr(t);return Wr(An({},n,{saturation:Ro(0,1,n.saturation-parseFloat(e))}))}var dk=Zn(e3);function n3(e,t){if(t==="transparent")return t;var n=Hr(t);return Wr(An({},n,{lightness:Ro(0,1,n.lightness+parseFloat(e))}))}var pk=Zn(n3);function i3(e,t,n){if(t==="transparent")return n;if(n==="transparent")return t;if(e===0)return n;var i=Vr(t),r=An({},i,{alpha:typeof i.alpha=="number"?i.alpha:1}),s=Vr(n),o=An({},s,{alpha:typeof s.alpha=="number"?s.alpha:1}),a=r.alpha-o.alpha,c=parseFloat(e)*2-1,l=c*a===-1?c:c+a,h=1+c*a,u=(l/h+1)/2,d=1-u,f={red:Math.floor(r.red*u+o.red*d),green:Math.floor(r.green*u+o.green*d),blue:Math.floor(r.blue*u+o.blue*d),alpha:r.alpha*parseFloat(e)+o.alpha*(1-parseFloat(e))};return Su(f)}var r3=Zn(i3),Dv=r3;function s3(e,t){if(t==="transparent")return t;var n=Vr(t),i=typeof n.alpha=="number"?n.alpha:1,r=An({},n,{alpha:Ro(0,1,(i*100+parseFloat(e)*100)/100)});return Su(r)}var o3=Zn(s3),Nv=o3;function a3(e,t){if(t==="transparent")return t;var n=Hr(t);return Wr(An({},n,{saturation:Ro(0,1,n.saturation+parseFloat(e))}))}var mk=Zn(a3);function c3(e,t){return t==="transparent"?t:Wr(An({},Hr(t),{hue:parseFloat(e)}))}var gk=Zn(c3);function l3(e,t){return t==="transparent"?t:Wr(An({},Hr(t),{lightness:parseFloat(e)}))}var _k=Zn(l3);function h3(e,t){return t==="transparent"?t:Wr(An({},Hr(t),{saturation:parseFloat(e)}))}var yk=Zn(h3);function u3(e,t){return t==="transparent"?t:Dv(parseFloat(e),"rgb(0, 0, 0)",t)}var vk=Zn(u3);function f3(e,t){return t==="transparent"?t:Dv(parseFloat(e),"rgb(255, 255, 255)",t)}var bk=Zn(f3);function d3(e,t){if(t==="transparent")return t;var n=Vr(t),i=typeof n.alpha=="number"?n.alpha:1,r=An({},n,{alpha:Ro(0,1,+(i*100-parseFloat(e)*100).toFixed(2)/100)});return Su(r)}var xk=Zn(d3);var $r=Object.freeze({Linear:Object.freeze({None:function(e){return e},In:function(e){return e},Out:function(e){return e},InOut:function(e){return e}}),Quadratic:Object.freeze({In:function(e){return e*e},Out:function(e){return e*(2-e)},InOut:function(e){return(e*=2)<1?.5*e*e:-.5*(--e*(e-2)-1)}}),Cubic:Object.freeze({In:function(e){return e*e*e},Out:function(e){return--e*e*e+1},InOut:function(e){return(e*=2)<1?.5*e*e*e:.5*((e-=2)*e*e+2)}}),Quartic:Object.freeze({In:function(e){return e*e*e*e},Out:function(e){return 1- --e*e*e*e},InOut:function(e){return(e*=2)<1?.5*e*e*e*e:-.5*((e-=2)*e*e*e-2)}}),Quintic:Object.freeze({In:function(e){return e*e*e*e*e},Out:function(e){return--e*e*e*e*e+1},InOut:function(e){return(e*=2)<1?.5*e*e*e*e*e:.5*((e-=2)*e*e*e*e+2)}}),Sinusoidal:Object.freeze({In:function(e){return 1-Math.sin((1-e)*Math.PI/2)},Out:function(e){return Math.sin(e*Math.PI/2)},InOut:function(e){return .5*(1-Math.sin(Math.PI*(.5-e)))}}),Exponential:Object.freeze({In:function(e){return e===0?0:Math.pow(1024,e-1)},Out:function(e){return e===1?1:1-Math.pow(2,-10*e)},InOut:function(e){return e===0?0:e===1?1:(e*=2)<1?.5*Math.pow(1024,e-1):.5*(-Math.pow(2,-10*(e-1))+2)}}),Circular:Object.freeze({In:function(e){return 1-Math.sqrt(1-e*e)},Out:function(e){return Math.sqrt(1- --e*e)},InOut:function(e){return(e*=2)<1?-.5*(Math.sqrt(1-e*e)-1):.5*(Math.sqrt(1-(e-=2)*e)+1)}}),Elastic:Object.freeze({In:function(e){return e===0?0:e===1?1:-Math.pow(2,10*(e-1))*Math.sin((e-1.1)*5*Math.PI)},Out:function(e){return e===0?0:e===1?1:Math.pow(2,-10*e)*Math.sin((e-.1)*5*Math.PI)+1},InOut:function(e){return e===0?0:e===1?1:(e*=2,e<1?-.5*Math.pow(2,10*(e-1))*Math.sin((e-1.1)*5*Math.PI):.5*Math.pow(2,-10*(e-1))*Math.sin((e-1.1)*5*Math.PI)+1)}}),Back:Object.freeze({In:function(e){var t=1.70158;return e===1?1:e*e*((t+1)*e-t)},Out:function(e){var t=1.70158;return e===0?0:--e*e*((t+1)*e+t)+1},InOut:function(e){var t=2.5949095;return(e*=2)<1?.5*(e*e*((t+1)*e-t)):.5*((e-=2)*e*((t+1)*e+t)+2)}}),Bounce:Object.freeze({In:function(e){return 1-$r.Bounce.Out(1-e)},Out:function(e){return e<.36363636363636365?7.5625*e*e:e<.7272727272727273?7.5625*(e-=.5454545454545454)*e+.75:e<.9090909090909091?7.5625*(e-=.8181818181818182)*e+.9375:7.5625*(e-=.9545454545454546)*e+.984375},InOut:function(e){return e<.5?$r.Bounce.In(e*2)*.5:$r.Bounce.Out(e*2-1)*.5+.5}}),generatePow:function(e){return e===void 0&&(e=4),e=e<Number.EPSILON?Number.EPSILON:e,e=e>1e4?1e4:e,{In:function(t){return Math.pow(t,e)},Out:function(t){return 1-Math.pow(1-t,e)},InOut:function(t){return t<.5?Math.pow(t*2,e)/2:(1-Math.pow(2-t*2,e))/2+.5}}}}),nc=function(){return performance.now()},Dp=(function(){function e(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];this._tweens={},this._tweensAddedDuringUpdate={},this.add.apply(this,t)}return e.prototype.getAll=function(){var t=this;return Object.keys(this._tweens).map(function(n){return t._tweens[n]})},e.prototype.removeAll=function(){this._tweens={}},e.prototype.add=function(){for(var t,n=[],i=0;i<arguments.length;i++)n[i]=arguments[i];for(var r=0,s=n;r<s.length;r++){var o=s[r];(t=o._group)===null||t===void 0||t.remove(o),o._group=this,this._tweens[o.getId()]=o,this._tweensAddedDuringUpdate[o.getId()]=o}},e.prototype.remove=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];for(var i=0,r=t;i<r.length;i++){var s=r[i];s._group=void 0,delete this._tweens[s.getId()],delete this._tweensAddedDuringUpdate[s.getId()]}},e.prototype.allStopped=function(){return this.getAll().every(function(t){return!t.isPlaying()})},e.prototype.update=function(t,n){t===void 0&&(t=nc()),n===void 0&&(n=!0);var i=Object.keys(this._tweens);if(i.length!==0)for(;i.length>0;){this._tweensAddedDuringUpdate={};for(var r=0;r<i.length;r++){var s=this._tweens[i[r]],o=!n;s&&s.update(t,o)===!1&&!n&&this.remove(s)}i=Object.keys(this._tweensAddedDuringUpdate)}},e})(),Po={Linear:function(e,t){var n=e.length-1,i=n*t,r=Math.floor(i),s=Po.Utils.Linear;return t<0?s(e[0],e[1],i):t>1?s(e[n],e[n-1],n-i):s(e[r],e[r+1>n?n:r+1],i-r)},Bezier:function(e,t){for(var n=0,i=e.length-1,r=Math.pow,s=Po.Utils.Bernstein,o=0;o<=i;o++)n+=r(1-t,i-o)*r(t,o)*e[o]*s(i,o);return n},CatmullRom:function(e,t){var n=e.length-1,i=n*t,r=Math.floor(i),s=Po.Utils.CatmullRom;return e[0]===e[n]?(t<0&&(r=Math.floor(i=n*(1+t))),s(e[(r-1+n)%n],e[r],e[(r+1)%n],e[(r+2)%n],i-r)):t<0?e[0]-(s(e[0],e[0],e[1],e[1],-i)-e[0]):t>1?e[n]-(s(e[n],e[n],e[n-1],e[n-1],i-n)-e[n]):s(e[r?r-1:0],e[r],e[n<r+1?n:r+1],e[n<r+2?n:r+2],i-r)},Utils:{Linear:function(e,t,n){return(t-e)*n+e},Bernstein:function(e,t){var n=Po.Utils.Factorial;return n(e)/n(t)/n(e-t)},Factorial:(function(){var e=[1];return function(t){var n=1;if(e[t])return e[t];for(var i=t;i>1;i--)n*=i;return e[t]=n,n}})(),CatmullRom:function(e,t,n,i,r){var s=(n-e)*.5,o=(i-t)*.5,a=r*r,c=r*a;return(2*t-2*n+s+o)*c+(-3*t+3*n-2*s-o)*a+s*r+t}}},Ov=(function(){function e(){}return e.nextId=function(){return e._nextId++},e._nextId=0,e})(),Lp=new Dp,Np=(function(){function e(t,n){this._isPaused=!1,this._pauseStart=0,this._valuesStart={},this._valuesEnd={},this._valuesStartRepeat={},this._duration=1e3,this._isDynamic=!1,this._initialRepeat=0,this._repeat=0,this._yoyo=!1,this._isPlaying=!1,this._reversed=!1,this._delayTime=0,this._startTime=0,this._easingFunction=$r.Linear.None,this._interpolationFunction=Po.Linear,this._chainedTweens=[],this._onStartCallbackFired=!1,this._onEveryStartCallbackFired=!1,this._id=Ov.nextId(),this._isChainStopped=!1,this._propertiesAreSetUp=!1,this._goToEnd=!1,this._object=t,typeof n=="object"?(this._group=n,n.add(this)):n===!0&&(this._group=Lp,Lp.add(this))}return e.prototype.getId=function(){return this._id},e.prototype.isPlaying=function(){return this._isPlaying},e.prototype.isPaused=function(){return this._isPaused},e.prototype.getDuration=function(){return this._duration},e.prototype.to=function(t,n){if(n===void 0&&(n=1e3),this._isPlaying)throw new Error("Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.");return this._valuesEnd=t,this._propertiesAreSetUp=!1,this._duration=n<0?0:n,this},e.prototype.duration=function(t){return t===void 0&&(t=1e3),this._duration=t<0?0:t,this},e.prototype.dynamic=function(t){return t===void 0&&(t=!1),this._isDynamic=t,this},e.prototype.start=function(t,n){if(t===void 0&&(t=nc()),n===void 0&&(n=!1),this._isPlaying)return this;if(this._repeat=this._initialRepeat,this._reversed){this._reversed=!1;for(var i in this._valuesStartRepeat)this._swapEndStartRepeatValues(i),this._valuesStart[i]=this._valuesStartRepeat[i]}if(this._isPlaying=!0,this._isPaused=!1,this._onStartCallbackFired=!1,this._onEveryStartCallbackFired=!1,this._isChainStopped=!1,this._startTime=t,this._startTime+=this._delayTime,!this._propertiesAreSetUp||n){if(this._propertiesAreSetUp=!0,!this._isDynamic){var r={};for(var s in this._valuesEnd)r[s]=this._valuesEnd[s];this._valuesEnd=r}this._setupProperties(this._object,this._valuesStart,this._valuesEnd,this._valuesStartRepeat,n)}return this},e.prototype.startFromCurrentValues=function(t){return this.start(t,!0)},e.prototype._setupProperties=function(t,n,i,r,s){for(var o in i){var a=t[o],c=Array.isArray(a),l=c?"array":typeof a,h=!c&&Array.isArray(i[o]);if(!(l==="undefined"||l==="function")){if(h){var u=i[o];if(u.length===0)continue;for(var d=[a],f=0,p=u.length;f<p;f+=1){var _=this._handleRelativeValue(a,u[f]);if(isNaN(_)){h=!1,console.warn("Found invalid interpolation list. Skipping.");break}d.push(_)}h&&(i[o]=d)}if((l==="object"||c)&&a&&!h){n[o]=c?[]:{};var g=a;for(var m in g)n[o][m]=g[m];r[o]=c?[]:{};var u=i[o];if(!this._isDynamic){var y={};for(var m in u)y[m]=u[m];i[o]=u=y}this._setupProperties(g,n[o],u,r[o],s)}else(typeof n[o]>"u"||s)&&(n[o]=a),c||(n[o]*=1),h?r[o]=i[o].slice().reverse():r[o]=n[o]||0}}},e.prototype.stop=function(){return this._isChainStopped||(this._isChainStopped=!0,this.stopChainedTweens()),this._isPlaying?(this._isPlaying=!1,this._isPaused=!1,this._onStopCallback&&this._onStopCallback(this._object),this):this},e.prototype.end=function(){return this._goToEnd=!0,this.update(this._startTime+this._duration),this},e.prototype.pause=function(t){return t===void 0&&(t=nc()),this._isPaused||!this._isPlaying?this:(this._isPaused=!0,this._pauseStart=t,this)},e.prototype.resume=function(t){return t===void 0&&(t=nc()),!this._isPaused||!this._isPlaying?this:(this._isPaused=!1,this._startTime+=t-this._pauseStart,this._pauseStart=0,this)},e.prototype.stopChainedTweens=function(){for(var t=0,n=this._chainedTweens.length;t<n;t++)this._chainedTweens[t].stop();return this},e.prototype.group=function(t){return t?(t.add(this),this):(console.warn("tween.group() without args has been removed, use group.add(tween) instead."),this)},e.prototype.remove=function(){var t;return(t=this._group)===null||t===void 0||t.remove(this),this},e.prototype.delay=function(t){return t===void 0&&(t=0),this._delayTime=t,this},e.prototype.repeat=function(t){return t===void 0&&(t=0),this._initialRepeat=t,this._repeat=t,this},e.prototype.repeatDelay=function(t){return this._repeatDelayTime=t,this},e.prototype.yoyo=function(t){return t===void 0&&(t=!1),this._yoyo=t,this},e.prototype.easing=function(t){return t===void 0&&(t=$r.Linear.None),this._easingFunction=t,this},e.prototype.interpolation=function(t){return t===void 0&&(t=Po.Linear),this._interpolationFunction=t,this},e.prototype.chain=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];return this._chainedTweens=t,this},e.prototype.onStart=function(t){return this._onStartCallback=t,this},e.prototype.onEveryStart=function(t){return this._onEveryStartCallback=t,this},e.prototype.onUpdate=function(t){return this._onUpdateCallback=t,this},e.prototype.onRepeat=function(t){return this._onRepeatCallback=t,this},e.prototype.onComplete=function(t){return this._onCompleteCallback=t,this},e.prototype.onStop=function(t){return this._onStopCallback=t,this},e.prototype.update=function(t,n){var i=this,r;if(t===void 0&&(t=nc()),n===void 0&&(n=e.autoStartOnUpdate),this._isPaused)return!0;var s;if(!this._goToEnd&&!this._isPlaying)if(n)this.start(t,!0);else return!1;if(this._goToEnd=!1,t<this._startTime)return!0;this._onStartCallbackFired===!1&&(this._onStartCallback&&this._onStartCallback(this._object),this._onStartCallbackFired=!0),this._onEveryStartCallbackFired===!1&&(this._onEveryStartCallback&&this._onEveryStartCallback(this._object),this._onEveryStartCallbackFired=!0);var o=t-this._startTime,a=this._duration+((r=this._repeatDelayTime)!==null&&r!==void 0?r:this._delayTime),c=this._duration+this._repeat*a,l=function(){if(i._duration===0||o>c)return 1;var _=Math.trunc(o/a),g=o-_*a,m=Math.min(g/i._duration,1);return m===0&&o===i._duration?1:m},h=l(),u=this._easingFunction(h);if(this._updateProperties(this._object,this._valuesStart,this._valuesEnd,u),this._onUpdateCallback&&this._onUpdateCallback(this._object,h),this._duration===0||o>=this._duration)if(this._repeat>0){var d=Math.min(Math.trunc((o-this._duration)/a)+1,this._repeat);isFinite(this._repeat)&&(this._repeat-=d);for(s in this._valuesStartRepeat)!this._yoyo&&typeof this._valuesEnd[s]=="string"&&(this._valuesStartRepeat[s]=this._valuesStartRepeat[s]+parseFloat(this._valuesEnd[s])),this._yoyo&&this._swapEndStartRepeatValues(s),this._valuesStart[s]=this._valuesStartRepeat[s];return this._yoyo&&(this._reversed=!this._reversed),this._startTime+=a*d,this._onRepeatCallback&&this._onRepeatCallback(this._object),this._onEveryStartCallbackFired=!1,!0}else{this._onCompleteCallback&&this._onCompleteCallback(this._object);for(var f=0,p=this._chainedTweens.length;f<p;f++)this._chainedTweens[f].start(this._startTime+this._duration,!1);return this._isPlaying=!1,!1}return!0},e.prototype._updateProperties=function(t,n,i,r){for(var s in i)if(n[s]!==void 0){var o=n[s]||0,a=i[s],c=Array.isArray(t[s]),l=Array.isArray(a),h=!c&&l;h?t[s]=this._interpolationFunction(a,r):typeof a=="object"&&a?this._updateProperties(t[s],o,a,r):(a=this._handleRelativeValue(o,a),typeof a=="number"&&(t[s]=o+(a-o)*r))}},e.prototype._handleRelativeValue=function(t,n){return typeof n!="string"?n:n.charAt(0)==="+"||n.charAt(0)==="-"?t+parseFloat(n):parseFloat(n)},e.prototype._swapEndStartRepeatValues=function(t){var n=this._valuesStartRepeat[t],i=this._valuesEnd[t];typeof i=="string"?this._valuesStartRepeat[t]=this._valuesStartRepeat[t]+parseFloat(i):this._valuesStartRepeat[t]=this._valuesEnd[t],this._valuesEnd[t]=n},e.autoStartOnUpdate=!1,e})();var Sk=Ov.nextId,ki=Lp,wk=ki.getAll.bind(ki),Ek=ki.removeAll.bind(ki),Tk=ki.add.bind(ki),Ak=ki.remove.bind(ki),Ck=ki.update.bind(ki);var Op="http://www.w3.org/1999/xhtml",Fv={svg:"http://www.w3.org/2000/svg",xhtml:Op,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};function Uv(e){var t=e+="",n=t.indexOf(":");return n>=0&&(t=e.slice(0,n))!=="xmlns"&&(e=e.slice(n+1)),Fv.hasOwnProperty(t)?{space:Fv[t],local:e}:e}function p3(e){return function(){var t=this.ownerDocument,n=this.namespaceURI;return n===Op&&t.documentElement.namespaceURI===Op?t.createElement(e):t.createElementNS(n,e)}}function m3(e){return function(){return this.ownerDocument.createElementNS(e.space,e.local)}}function kv(e){var t=Uv(e);return(t.local?m3:p3)(t)}function g3(){}function Bv(e){return e==null?g3:function(){return this.querySelector(e)}}function _3(e){typeof e!="function"&&(e=Bv(e));for(var t=this._groups,n=t.length,i=new Array(n),r=0;r<n;++r)for(var s=t[r],o=s.length,a=i[r]=new Array(o),c,l,h=0;h<o;++h)(c=s[h])&&(l=e.call(c,c.__data__,h,s))&&("__data__"in c&&(l.__data__=c.__data__),a[h]=l);return new Kn(i,this._parents)}function y3(e){return e==null?[]:Array.isArray(e)?e:Array.from(e)}function v3(){return[]}function b3(e){return e==null?v3:function(){return this.querySelectorAll(e)}}function x3(e){return function(){return y3(e.apply(this,arguments))}}function M3(e){typeof e=="function"?e=x3(e):e=b3(e);for(var t=this._groups,n=t.length,i=[],r=[],s=0;s<n;++s)for(var o=t[s],a=o.length,c,l=0;l<a;++l)(c=o[l])&&(i.push(e.call(c,c.__data__,l,o)),r.push(c));return new Kn(i,r)}function S3(e){return function(){return this.matches(e)}}function zv(e){return function(t){return t.matches(e)}}var w3=Array.prototype.find;function E3(e){return function(){return w3.call(this.children,e)}}function T3(){return this.firstElementChild}function A3(e){return this.select(e==null?T3:E3(typeof e=="function"?e:zv(e)))}var C3=Array.prototype.filter;function R3(){return Array.from(this.children)}function P3(e){return function(){return C3.call(this.children,e)}}function I3(e){return this.selectAll(e==null?R3:P3(typeof e=="function"?e:zv(e)))}function L3(e){typeof e!="function"&&(e=S3(e));for(var t=this._groups,n=t.length,i=new Array(n),r=0;r<n;++r)for(var s=t[r],o=s.length,a=i[r]=[],c,l=0;l<o;++l)(c=s[l])&&e.call(c,c.__data__,l,s)&&a.push(c);return new Kn(i,this._parents)}function Gv(e){return new Array(e.length)}function D3(){return new Kn(this._enter||this._groups.map(Gv),this._parents)}function wu(e,t){this.ownerDocument=e.ownerDocument,this.namespaceURI=e.namespaceURI,this._next=null,this._parent=e,this.__data__=t}wu.prototype={constructor:wu,appendChild:function(e){return this._parent.insertBefore(e,this._next)},insertBefore:function(e,t){return this._parent.insertBefore(e,t)},querySelector:function(e){return this._parent.querySelector(e)},querySelectorAll:function(e){return this._parent.querySelectorAll(e)}};function N3(e){return function(){return e}}function O3(e,t,n,i,r,s){for(var o=0,a,c=t.length,l=s.length;o<l;++o)(a=t[o])?(a.__data__=s[o],i[o]=a):n[o]=new wu(e,s[o]);for(;o<c;++o)(a=t[o])&&(r[o]=a)}function F3(e,t,n,i,r,s,o){var a,c,l=new Map,h=t.length,u=s.length,d=new Array(h),f;for(a=0;a<h;++a)(c=t[a])&&(d[a]=f=o.call(c,c.__data__,a,t)+"",l.has(f)?r[a]=c:l.set(f,c));for(a=0;a<u;++a)f=o.call(e,s[a],a,s)+"",(c=l.get(f))?(i[a]=c,c.__data__=s[a],l.delete(f)):n[a]=new wu(e,s[a]);for(a=0;a<h;++a)(c=t[a])&&l.get(d[a])===c&&(r[a]=c)}function U3(e){return e.__data__}function k3(e,t){if(!arguments.length)return Array.from(this,U3);var n=t?F3:O3,i=this._parents,r=this._groups;typeof e!="function"&&(e=N3(e));for(var s=r.length,o=new Array(s),a=new Array(s),c=new Array(s),l=0;l<s;++l){var h=i[l],u=r[l],d=u.length,f=B3(e.call(h,h&&h.__data__,l,i)),p=f.length,_=a[l]=new Array(p),g=o[l]=new Array(p),m=c[l]=new Array(d);n(h,u,_,g,m,f,t);for(var y=0,x=0,b,S;y<p;++y)if(b=_[y]){for(y>=x&&(x=y+1);!(S=g[x])&&++x<p;);b._next=S||null}}return o=new Kn(o,i),o._enter=a,o._exit=c,o}function B3(e){return typeof e=="object"&&"length"in e?e:Array.from(e)}function z3(){return new Kn(this._exit||this._groups.map(Gv),this._parents)}function G3(e,t,n){var i=this.enter(),r=this,s=this.exit();return typeof e=="function"?(i=e(i),i&&(i=i.selection())):i=i.append(e+""),t!=null&&(r=t(r),r&&(r=r.selection())),n==null?s.remove():n(s),i&&r?i.merge(r).order():r}function V3(e){for(var t=e.selection?e.selection():e,n=this._groups,i=t._groups,r=n.length,s=i.length,o=Math.min(r,s),a=new Array(r),c=0;c<o;++c)for(var l=n[c],h=i[c],u=l.length,d=a[c]=new Array(u),f,p=0;p<u;++p)(f=l[p]||h[p])&&(d[p]=f);for(;c<r;++c)a[c]=n[c];return new Kn(a,this._parents)}function H3(){for(var e=this._groups,t=-1,n=e.length;++t<n;)for(var i=e[t],r=i.length-1,s=i[r],o;--r>=0;)(o=i[r])&&(s&&o.compareDocumentPosition(s)^4&&s.parentNode.insertBefore(o,s),s=o);return this}function W3(e){e||(e=$3);function t(u,d){return u&&d?e(u.__data__,d.__data__):!u-!d}for(var n=this._groups,i=n.length,r=new Array(i),s=0;s<i;++s){for(var o=n[s],a=o.length,c=r[s]=new Array(a),l,h=0;h<a;++h)(l=o[h])&&(c[h]=l);c.sort(t)}return new Kn(r,this._parents).order()}function $3(e,t){return e<t?-1:e>t?1:e>=t?0:NaN}function j3(){var e=arguments[0];return arguments[0]=this,e.apply(null,arguments),this}function q3(){return Array.from(this)}function X3(){for(var e=this._groups,t=0,n=e.length;t<n;++t)for(var i=e[t],r=0,s=i.length;r<s;++r){var o=i[r];if(o)return o}return null}function Y3(){let e=0;for(let t of this)++e;return e}function Z3(){return!this.node()}function K3(e){for(var t=this._groups,n=0,i=t.length;n<i;++n)for(var r=t[n],s=0,o=r.length,a;s<o;++s)(a=r[s])&&e.call(a,a.__data__,s,r);return this}function J3(e){return function(){this.removeAttribute(e)}}function Q3(e){return function(){this.removeAttributeNS(e.space,e.local)}}function tP(e,t){return function(){this.setAttribute(e,t)}}function eP(e,t){return function(){this.setAttributeNS(e.space,e.local,t)}}function nP(e,t){return function(){var n=t.apply(this,arguments);n==null?this.removeAttribute(e):this.setAttribute(e,n)}}function iP(e,t){return function(){var n=t.apply(this,arguments);n==null?this.removeAttributeNS(e.space,e.local):this.setAttributeNS(e.space,e.local,n)}}function rP(e,t){var n=Uv(e);if(arguments.length<2){var i=this.node();return n.local?i.getAttributeNS(n.space,n.local):i.getAttribute(n)}return this.each((t==null?n.local?Q3:J3:typeof t=="function"?n.local?iP:nP:n.local?eP:tP)(n,t))}function Vv(e){return e.ownerDocument&&e.ownerDocument.defaultView||e.document&&e||e.defaultView}function sP(e){return function(){this.style.removeProperty(e)}}function oP(e,t,n){return function(){this.style.setProperty(e,t,n)}}function aP(e,t,n){return function(){var i=t.apply(this,arguments);i==null?this.style.removeProperty(e):this.style.setProperty(e,i,n)}}function cP(e,t,n){return arguments.length>1?this.each((t==null?sP:typeof t=="function"?aP:oP)(e,t,n??"")):lP(this.node(),e)}function lP(e,t){return e.style.getPropertyValue(t)||Vv(e).getComputedStyle(e,null).getPropertyValue(t)}function hP(e){return function(){delete this[e]}}function uP(e,t){return function(){this[e]=t}}function fP(e,t){return function(){var n=t.apply(this,arguments);n==null?delete this[e]:this[e]=n}}function dP(e,t){return arguments.length>1?this.each((t==null?hP:typeof t=="function"?fP:uP)(e,t)):this.node()[e]}function Hv(e){return e.trim().split(/^|\s+/)}function Up(e){return e.classList||new Wv(e)}function Wv(e){this._node=e,this._names=Hv(e.getAttribute("class")||"")}Wv.prototype={add:function(e){var t=this._names.indexOf(e);t<0&&(this._names.push(e),this._node.setAttribute("class",this._names.join(" ")))},remove:function(e){var t=this._names.indexOf(e);t>=0&&(this._names.splice(t,1),this._node.setAttribute("class",this._names.join(" ")))},contains:function(e){return this._names.indexOf(e)>=0}};function $v(e,t){for(var n=Up(e),i=-1,r=t.length;++i<r;)n.add(t[i])}function jv(e,t){for(var n=Up(e),i=-1,r=t.length;++i<r;)n.remove(t[i])}function pP(e){return function(){$v(this,e)}}function mP(e){return function(){jv(this,e)}}function gP(e,t){return function(){(t.apply(this,arguments)?$v:jv)(this,e)}}function _P(e,t){var n=Hv(e+"");if(arguments.length<2){for(var i=Up(this.node()),r=-1,s=n.length;++r<s;)if(!i.contains(n[r]))return!1;return!0}return this.each((typeof t=="function"?gP:t?pP:mP)(n,t))}function yP(){this.textContent=""}function vP(e){return function(){this.textContent=e}}function bP(e){return function(){var t=e.apply(this,arguments);this.textContent=t??""}}function xP(e){return arguments.length?this.each(e==null?yP:(typeof e=="function"?bP:vP)(e)):this.node().textContent}function MP(){this.innerHTML=""}function SP(e){return function(){this.innerHTML=e}}function wP(e){return function(){var t=e.apply(this,arguments);this.innerHTML=t??""}}function EP(e){return arguments.length?this.each(e==null?MP:(typeof e=="function"?wP:SP)(e)):this.node().innerHTML}function TP(){this.nextSibling&&this.parentNode.appendChild(this)}function AP(){return this.each(TP)}function CP(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}function RP(){return this.each(CP)}function PP(e){var t=typeof e=="function"?e:kv(e);return this.select(function(){return this.appendChild(t.apply(this,arguments))})}function IP(){return null}function LP(e,t){var n=typeof e=="function"?e:kv(e),i=t==null?IP:typeof t=="function"?t:Bv(t);return this.select(function(){return this.insertBefore(n.apply(this,arguments),i.apply(this,arguments)||null)})}function DP(){var e=this.parentNode;e&&e.removeChild(this)}function NP(){return this.each(DP)}function OP(){var e=this.cloneNode(!1),t=this.parentNode;return t?t.insertBefore(e,this.nextSibling):e}function FP(){var e=this.cloneNode(!0),t=this.parentNode;return t?t.insertBefore(e,this.nextSibling):e}function UP(e){return this.select(e?FP:OP)}function kP(e){return arguments.length?this.property("__data__",e):this.node().__data__}function BP(e){return function(t){e.call(this,t,this.__data__)}}function zP(e){return e.trim().split(/^|\s+/).map(function(t){var n="",i=t.indexOf(".");return i>=0&&(n=t.slice(i+1),t=t.slice(0,i)),{type:t,name:n}})}function GP(e){return function(){var t=this.__on;if(t){for(var n=0,i=-1,r=t.length,s;n<r;++n)s=t[n],(!e.type||s.type===e.type)&&s.name===e.name?this.removeEventListener(s.type,s.listener,s.options):t[++i]=s;++i?t.length=i:delete this.__on}}}function VP(e,t,n){return function(){var i=this.__on,r,s=BP(t);if(i){for(var o=0,a=i.length;o<a;++o)if((r=i[o]).type===e.type&&r.name===e.name){this.removeEventListener(r.type,r.listener,r.options),this.addEventListener(r.type,r.listener=s,r.options=n),r.value=t;return}}this.addEventListener(e.type,s,n),r={type:e.type,name:e.name,value:t,listener:s,options:n},i?i.push(r):this.__on=[r]}}function HP(e,t,n){var i=zP(e+""),r,s=i.length,o;if(arguments.length<2){var a=this.node().__on;if(a){for(var c=0,l=a.length,h;c<l;++c)for(r=0,h=a[c];r<s;++r)if((o=i[r]).type===h.type&&o.name===h.name)return h.value}return}for(a=t?VP:GP,r=0;r<s;++r)this.each(a(i[r],t,n));return this}function qv(e,t,n){var i=Vv(e),r=i.CustomEvent;typeof r=="function"?r=new r(t,n):(r=i.document.createEvent("Event"),n?(r.initEvent(t,n.bubbles,n.cancelable),r.detail=n.detail):r.initEvent(t,!1,!1)),e.dispatchEvent(r)}function WP(e,t){return function(){return qv(this,e,t)}}function $P(e,t){return function(){return qv(this,e,t.apply(this,arguments))}}function jP(e,t){return this.each((typeof t=="function"?$P:WP)(e,t))}function*qP(){for(var e=this._groups,t=0,n=e.length;t<n;++t)for(var i=e[t],r=0,s=i.length,o;r<s;++r)(o=i[r])&&(yield o)}var Xv=[null];function Kn(e,t){this._groups=e,this._parents=t}function XP(){return new Kn([[document.documentElement]],Xv)}function YP(){return this}Kn.prototype=XP.prototype={constructor:Kn,select:_3,selectAll:M3,selectChild:A3,selectChildren:I3,filter:L3,data:k3,enter:D3,exit:z3,join:G3,merge:V3,selection:YP,order:H3,sort:W3,call:j3,nodes:q3,node:X3,size:Y3,empty:Z3,each:K3,attr:rP,style:cP,property:dP,classed:_P,text:xP,html:EP,raise:AP,lower:RP,append:PP,insert:LP,remove:NP,clone:UP,datum:kP,on:HP,dispatch:jP,[Symbol.iterator]:qP};function Yv(e){return typeof e=="string"?new Kn([[document.querySelector(e)]],[document.documentElement]):new Kn([[e]],Xv)}var ZP=0;function KP(){return new Fp}function Fp(){this._="@"+(++ZP).toString(36)}Fp.prototype=KP.prototype={constructor:Fp,get:function(e){for(var t=this._;!(t in e);)if(!(e=e.parentNode))return;return e[t]},set:function(e,t){return e[this._]=t},remove:function(e){return this._ in e&&delete e[this._]},toString:function(){return this._}};function JP(e){let t;for(;t=e.sourceEvent;)e=t;return e}function Zv(e,t){if(e=JP(e),t===void 0&&(t=e.currentTarget),t){var n=t.ownerSVGElement||t;if(n.createSVGPoint){var i=n.createSVGPoint();return i.x=e.clientX,i.y=e.clientY,i=i.matrixTransform(t.getScreenCTM().inverse()),[i.x,i.y]}if(t.getBoundingClientRect){var r=t.getBoundingClientRect();return[e.clientX-r.left-t.clientLeft,e.clientY-r.top-t.clientTop]}}return[e.pageX,e.pageY]}var De,Qv,zp,jr,kp,Ru,tb,Tu,eb,Gp,Bp,QP,rc=Symbol.for("pv"),Pu={},Iu=[],tI=/^m(i|n|o|s|text|space)$/,Vp=Array.isArray,Hp=Iu.slice,qr=Object.assign;function xs(e){e&&e.parentNode&&e.remove()}function Wp(e,t,n){var i,r,s,o=qr({},e.props),a=arguments.length;for(s in t)s=="key"?i=t[s]:s=="ref"&&typeof e.type!="function"?r=t[s]:o[s]=t[s];return a>2&&(o.children=a>3?Hp.call(arguments,2):n),ic(e.type,o,i!==void 0?i:e.key,r!==void 0?r:e.ref,null)}function ic(e,t,n,i,r){var s={type:e,props:t,key:n,ref:i,__k:null,__:null,__b:0,__e:null,__c:null,constructor:rc,__v:r||++Qv,__i:-1,__u:0};return!r&&De.vnode&&De.vnode(s),s}function Lu(e){return e.children}function Au(e,t){this.props=e,this.context=t,this.__g=0}function Xr(e,t){if(t==null)return e.__&&Xr(e.__,e.__i+1);for(var n;t<e.__k.length;t++)if((n=e.__k[t])&&n.__e)return n.__e;return typeof e.type!="function"||e.props.__P?null:Xr(e)}function eI(e){var t,n=e.__v,i=n.__e,r=[],s=[],o=e.__P;o&&((t=qr({constructor:rc},n)).__v=n.__v+1,De.vnode&&De.vnode(t),$p(o,t,n,e.__n,o.namespaceURI,32&n.__u?[i]:null,r,i||Xr(n),32&n.__u,s),t.__v=n.__v,t.__.__k[t.__i]=t,ab(r,t,s),n.__=n.__e=null,t.__e!=i&&nb(t))}function nb(e){if((e=e.__)&&e.__c&&!e.props.__P)return e.__e=null,e.__k.some(function(t){return t&&(e.__e=t.__e)}),nb(e)}function Kv(e){(8&e.__g||(e.__g|=8,jr.push(e),Ru++))&&kp==De.debounceRendering||((kp=De.debounceRendering)||queueMicrotask)(ib)}function ib(){try{for(var e,t=1;jr.length;)jr.length>t&&jr.sort(tb),e=jr.shift(),t=jr.length,8&e.__g&&eI(e)}finally{(Ru=jr.length)&&(kp||queueMicrotask)(ib)}}function rb(e,t,n,i,r,s,o,a,c,l,h){var u,d,f,p,_,g,m=i.__k||Iu,y=t.length;for(c=nI(n,t,m,c,y),u=0;u<y;u++)(f=n.__k[u])!=null&&(d=~f.__i&&m[f.__i]||Pu,f.__i=u,g=$p(e,f,d,r,s,o,a,c,l,h),p=f.__e,(d.ref!=f.ref||8&d.__u)&&(d.ref&&jp(d.ref,null,f,d),f.ref&&h.push(f.ref,f.__c||p,f)),_=_||p,4&f.__u?(c=sb(f,c,e,!d.__v),d.__e&&(d.__e=null)):typeof f.type=="function"&&g!==void 0?c=g:p&&(c=p.nextSibling),f.__u&=-21);return n.__e=_,c}function nI(e,t,n,i,r){var s,o,a,c,l,h,u,d,f,p=n.length,_=p,g=0,m=0,y=e.__k=Array(r);for(s=0;s<r;s++)(o=t[s])!=null&&typeof o!="boolean"&&typeof o!="function"?(typeof o!="object"||o.constructor===String?o=y[s]=ic(null,o):Vp(o)?o=y[s]=ic(Lu,{children:o}):o.constructor===rc&&o.__b?o=y[s]=ic(o.type,o.props,o.key,o.ref,o.__v):y[s]=o,c=s+g,o.__=e,o.__b=e.__b+1,a=null,~(l=o.__i=iI(o,n,c,_))&&(_--,(a=n[l])&&(a.__u|=2)),a&&a.__v?(o.__u|=16,l==c-1?g--:l==c+1?g++:l!=c&&(l>c?g--:g++,m=1)):(~l||(r>p?g--:r<p&&g++),typeof o.type!="function"&&(o.__u|=4))):y[s]=null;if(m){for(h=[],u=[],s=0;s<r;s++)if((o=y[s])&&16&o.__u){for(g=0,d=h.length;g<d;)h[f=g+d>>1]<o.__i?g=f+1:d=f;h[g]=o.__i,u[s]=g+1}for(g=h.length;s--;)u[s]&&(u[s]==g?g--:y[s].__u|=4)}if(_)for(s=0;s<p;s++)!(a=n[s])||2&a.__u||(a.__e==i&&(i=Xr(a)),qp(a,a));return i}function sb(e,t,n,i){var r,s,o,a;if(typeof e.type=="function"){if(e.props.__P)return t;if(r=e.__k)for(s=0;s<r.length;s++)r[s]&&(r[s].__=e,t=sb(r[s],t,n,!1));return t}for(t&&!t.parentNode&&(t=Xr(e))&&!t.parentNode&&(t=null),o=e.__e,a=t;a&&a.nodeType==8;)a=a.nextSibling;for(o!=a&&(!i&&n.moveBefore&&o.parentNode?n.moveBefore(o,t):n.insertBefore(o,t||null)),t=o;(t=t&&t.nextSibling)&&t.nodeType==8&&!t.data.startsWith("$s"););return t}function iI(e,t,n,i){var r,s=e.key,o=e.type,a=t[n],c=a&&!(2&a.__u);if(a===null&&s==null||c&&s==a.key&&o==a.type)return n;if(i>(c?1:0)){for(r=n-1;r>=0;r--)if((a=t[r])&&!(2&a.__u)&&s==a.key&&o==a.type)return r;for(r=n+1;r<t.length;r++)if((a=t[r])&&!(2&a.__u)&&s==a.key&&o==a.type)return r}return-1}function Jv(e,t,n){n==null&&(n=""),t[0]=="-"?e.setProperty(t,n):e[t]=n}function Eu(e,t,n,i,r){var s,o;if(t=="style")if(typeof n=="string")e.style.cssText=n;else{if(typeof i=="string"&&(e.style.cssText=i=""),i)for(t in i)n&&t in n||Jv(e.style,t);if(n)for(t in n)i&&n[t]==i[t]||Jv(e.style,t,n[t])}else if(t[0]=="o"&&t[1]=="n")typeof n!="function"&&(n=null),typeof i!="function"&&(i=null),(e.__e||(e.__e={}))[t]=n,n&&i||(o=Bp[t]||(Bp[t]=rI(t)),(e.__a||(e.__a={}))[t]=Gp,s=t!=(t=t.replace(eb,"$1")),(t=t.slice(2))[0]<"a"&&(t=t.toLowerCase()),n?e.addEventListener(t,o,s):e.removeEventListener(t,o,s));else{if(r=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{return void(e[t]=n??"")}catch{}if(typeof n=="function")return;n==null||n===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&n==1?"":n)}}function rI(e){return function(t){var n=this.__e;if(n){if(n=n[e],t[Tu]==null)t[Tu]=Gp++;else if(t[Tu]<this.__a[e])return;return n(De.event?De.event(t):t)}}}function $p(e,t,n,i,r,s,o,a,c,l){var h,u,d,f,p,_,g,m,y,x,b,S,w,v,M,U,P,k,C=t.type;if(t.constructor!==rc)return null;128&n.__u&&(c=32&n.__u,h=n.__c.__z)&&(t.__u|=c,u=s=[],h.nodeType==8?a=Cu(h,s):s.push(h),a=s[0]||a),(h=De.__b)&&h(t);t:if(typeof C=="function"){d=o.length;try{if(m=t.props,y=(h=C.prototype)&&h.render,x=(h=C.contextType)&&i[h.__c],b=h?x?x.props.value:h.__:i,(f=n.__c)?(t.__c=f,2&f.__g&&(f.__g|=1)):(y?t.__c=f=new C(m,b):(t.__c=f=new Au(m,b),f.constructor=C,f.render=oI),x&&x.sub(f),f.state||(f.state={}),f.__n=i,f.__g|=8,f.__h=[],f.__k=[]),y&&(f.__s||(f.__s=f.state),C.getDerivedStateFromProps&&(f.__s==f.state&&(f.__s=qr({},f.__s)),qr(f.__s,C.getDerivedStateFromProps(m,f.__s)))),p=f.props,_=f.state,f.__v=t,n.__c){if(m!==p&&y&&!C.getDerivedStateFromProps&&f.componentWillReceiveProps&&f.componentWillReceiveProps(m,b),t.__v==n.__v&&!(8&f.__g)||!(4&f.__g)&&f.shouldComponentUpdate&&f.shouldComponentUpdate(m,f.__s,b)===!1){t.__v!=n.__v&&(f.props=m,f.state=f.__s,f.__g&=-9),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(N){N&&(N.__=t)}),Iu.push.apply(f.__h,f.__k),f.__k=[],f.__h.length&&o.push(f),a=Xr(n);break t}f.componentWillUpdate&&f.componentWillUpdate(m,f.__s,b),y&&f.componentDidUpdate&&f.__h.push(function(){f.componentDidUpdate(p,_,g)})}else y&&!C.getDerivedStateFromProps&&f.componentWillMount&&f.componentWillMount(),y&&f.componentDidMount&&f.__h.push(f.componentDidMount);f.context=b,f.props=m,f.__P=e,f.__g&=-5,S=De.__r,w=y?25:0;do f.__g&=-9,S&&S(t),h=f.render(f.props,f.state=f.__s,f.context);while(8&f.__g&&++w<25);y&&(Iu.push.apply(f.__h,f.__k),f.__k=[]),f.state=f.__s,f.getChildContext&&(i=qr({},i,f.getChildContext())),y&&n.__c&&f.getSnapshotBeforeUpdate&&(g=f.getSnapshotBeforeUpdate(p,_)),v=h&&h.type===Lu&&h.key==null?h.props.children:h,m.__P&&(h=a,r=(e=m.__P).namespaceURI,c=s=null,n.props&&n.props.__P!=e&&(n.__k.some(function(N){N&&qp(N,N)}),n.__k=null),a=n.__k?Xr(n,0):null),a=rb(e,Vp(v)?v:[v],t,n,i,r,s,o,a,c,l),m.__P&&(t.__e=null,a=h),t.__u&=-161,u&&u.some(xs),f.__h.length&&o.push(f),1&f.__g&&(f.__g&=-4)}catch(N){if(o.length=d,t.__v=null,c||s)if(N&&N.then){if(t.__u|=128|c,s){for(~(P=s.indexOf(a||void 0))||(P=s.length);(k=s[P-1])&&k.nodeType==8;)P--;for(;P<s.length;P++)if(k=s[P])if(s[P]=null,M){if(k==U)break}else{if(k.nodeType!=8)break;k.data.startsWith("$s")&&(U=Cu(M=k))}}if(!M){for(;a&&a.nodeType==8&&a.nextSibling;)a=a.nextSibling;M=a}(h=Cu(M=t.__c.__z||(t.__c.__z=M)))?(t.__e=M,a=h):t.__e=a,a=a&&a.nextSibling}else s&&s.some(xs);else t.__e=n.__e;t.__k||(t.__k=n.__k||[]),N&&N.then||ob(t),De.__e(N,t,n)}}else a=t.__e=sI(n.__e,t,n,i,r,s,o,c,l,e);return(h=De.diffed)&&h(t),a}function Cu(e,t){if(e&&e.nodeType==8&&e.data.startsWith("$s"))for(var n=1;e=e.nextSibling;){if(e.nodeType==8){if(e.data.startsWith("$s"))n++;else if(e.data.startsWith("/$s")&&!--n)return e}t&&t.push(e)}}function ob(e){e&&(e.__c&&(e.__c.__g|=4),e.__k&&e.__k.some(ob))}function ab(e,t,n){for(var i=0;i<n.length;)jp(n[i++],n[i++],n[i++]);De.__c&&De.__c(t,e),e.some(function(r){try{e=r.__h,r.__h=[],e.some(function(s){s.call(r)})}catch(s){De.__e(s,r.__v)}})}function sI(e,t,n,i,r,s,o,a,c,l){var h,u,d,f,p,_,g,m,y=n.props||Pu,x=t.props,b=t.type;if(b=="svg"?r="http://www.w3.org/2000/svg":b=="math"?r="http://www.w3.org/1998/Math/MathML":r||(r="http://www.w3.org/1999/xhtml"),s){for(h=0;h<s.length;h++)if((p=s[h])&&(b?p.localName==b:p.nodeType==3)){e=p,s[h]=null;break}}if(!e){if(m=l.ownerDocument||document,!b)return m.createTextNode(x);e=m.createElementNS(r,b,x.is?x:l),a&&(De.__m&&De.__m(t,s),a=!1),s=null}if(b){if(l=b=="template"&&e.content||e,s=b=="textarea"&&x.defaultValue!=null?null:s&&Hp.call(l.childNodes),!a&&s)for(y={},h=0;h<e.attributes.length;h++)y[(p=e.attributes[h]).name]=p.value;for(h in y)p=y[h],h=="dangerouslySetInnerHTML"?d=p:h=="children"||h in x||h=="value"&&"defaultValue"in x||h=="checked"&&"defaultChecked"in x||Eu(e,h,null,p,r);for(h in x)p=x[h],h=="children"?f=p:h=="dangerouslySetInnerHTML"?u=p:h=="value"?_=p:h=="checked"?g=p:a&&typeof p!="function"||y[h]===p||Eu(e,h,p,y[h],r);u?(a||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[]):(d&&(e.textContent=""),(b=="foreignObject"||r=="http://www.w3.org/1998/Math/MathML"&&tI.test(b))&&(r="http://www.w3.org/1999/xhtml"),rb(l,Vp(f)?f:[f],t,n,i,r,s,o,s?s[0]:n.__k&&Xr(n,0),a,c),s&&s.some(xs)),a&&b!="textarea"||(h="value",b=="progress"&&_==null?e.removeAttribute(h):_==null||_===e[h]&&(b!="progress"||_)||Eu(e,h,_,y[h],r),h="checked",g!=null&&g!=e[h]&&Eu(e,h,g,y[h],r))}else y===x||a&&e.data==x||(e.data=x);return e}function jp(e,t,n,i){try{typeof e=="function"?t?t.__x=e(t)||1:i&&(i=i.__c||i.__e)&&(t=i.__x)&&(i.__x=null,typeof t=="function"?t():e(null)):e.current=t}catch(r){De.__e(r,n)}}function qp(e,t,n){var i,r,s,o;if(De.unmount&&De.unmount(e),!(i=e.ref)||i.current&&i.current!=e.__e||jp(i,null,t,e),i=e.__c){if(i.componentWillUnmount)try{i.componentWillUnmount()}catch(a){De.__e(a,t)}i.__P=i.__n=null}if(i=e.__k)for(o=0;o<i.length;o++)i[o]&&qp(i[o],t,typeof e.type!="function"||n&&!e.props.__P);!n&&(i=e.__c)&&(i=i.__z)&&(r=Cu(i,s=[]))&&(i==e.__e&&s.some(xs),xs(r),xs(i)),n||xs(e.__e),e.__e=e.__c=e.__=null}function oI(e,t,n){return this.constructor(e,n)}function cb(e,t){var n,i,r,s;De.__&&De.__(e,t),t.nodeType==9&&(t=t.documentElement),i=(n=e&&32&e.__u)?null:t.__k,t.__k=ic(Lu,{children:[e]}),r=[],s=[],$p(t,t.__k,i||Pu,Pu,t.namespaceURI,i?null:t.firstChild?Hp.call(t.childNodes):null,r,i?i.__e:t.firstChild,n,s),ab(r,t.__k,s),t.__k.props.children=null}De={__e:function(e,t,n,i){for(var r,s,o;t=t.__;)if((r=t.__c)&&!(1&r.__g)){r.__g|=4;try{if((o=(s=r.constructor)&&s.getDerivedStateFromError)&&r.setState(s.getDerivedStateFromError(e)),r.componentDidCatch&&(r.componentDidCatch(e,i||{}),o=1),o&&8&r.__g)return void(r.__g|=2)}catch(a){e=a}}throw Ru=0,e}},Qv=0,zp=function(e){return e!=null&&e.constructor===rc},Au.prototype.setState=function(e,t){var n=this.__s;n&&n!=this.state||(n=this.__s=qr({},this.state)),typeof e=="function"&&(e=e(qr({},n),this.props)),e&&(qr(n,e),this.__v&&(t&&this.__k.push(t),Kv(this)))},Au.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),Kv(this))},Au.prototype.render=Lu,jr=[],Ru=0,tb=function(e,t){return e.__v.__b-t.__v.__b},Tu=Symbol(),eb=/(PointerCapture)$|Capture$/i,Gp=0,Bp={},QP=0;var Xp=e=>{if(typeof e!="object")return e;let t=Wp(e);return t.props&&(t.props={...t.props},t?.props?.children&&(t.props.children=Array.isArray(t.props.children)?t.props.children.map(Xp):Xp(t.props.children))),t},aI=e=>zp(Wp(e)),cI=(e,t)=>{delete t.__k,cb(Xp(e),t)};function lI(e,t){t===void 0&&(t={});var n=t.insertAt;if(!(typeof document>"u")){var i=document.head||document.getElementsByTagName("head")[0],r=document.createElement("style");r.type="text/css",n==="top"&&i.firstChild?i.insertBefore(r,i.firstChild):i.appendChild(r),r.styleSheet?r.styleSheet.cssText=e:r.appendChild(document.createTextNode(e))}}var hI=`.float-tooltip-kap {
  position: absolute;
  width: max-content; /* prevent shrinking near right edge */
  max-width: max(50%, 150px);
  padding: 3px 5px;
  border-radius: 3px;
  font: 12px sans-serif;
  color: #eee;
  background: rgba(0,0,0,0.6);
  pointer-events: none;
}
`;lI(hI);var lb=Ur({props:{content:{default:!1},offsetX:{triggerUpdate:!1},offsetY:{triggerUpdate:!1}},methods:{positionFromEvent(e,t){let n=e.container,i=Zv(t,n),r=n.offsetWidth,s=n.offsetHeight,o=[e.offsetX===null||e.offsetX===void 0?`-${i[0]/r*100}%`:typeof e.offsetX=="number"?`calc(-50% + ${e.offsetX}px)`:e.offsetX,e.offsetY===null||e.offsetY===void 0?s>130&&s-i[1]<100?"calc(-100% - 6px)":"21px":typeof e.offsetY=="number"?e.offsetY<0?`calc(-100% - ${Math.abs(e.offsetY)}px)`:`${e.offsetY}px`:e.offsetY];return e.tooltipEl.style("left",i[0]+"px").style("top",i[1]+"px").style("transform",`translate(${o.join(",")})`),this}},init:function(e,t,{style:n={}}={}){let i=!!e&&typeof e=="object"&&!!e.node&&typeof e.node=="function",r=Yv(i?e.node():e);t.container=r.node(),r.style("position")==="static"&&r.style("position","relative"),t.tooltipEl=r.append("div").attr("class","float-tooltip-kap"),Object.entries(n).forEach(([o,a])=>t.tooltipEl.style(o,a)),t.tooltipEl.style("left","-10000px").style("display","none");let s=`tooltip-${Math.round(Math.random()*1e12)}`;t.mouseInside=!1,r.on(`mousemove.${s}`,o=>{t.mouseInside=!0,this.positionFromEvent(o),t.content&&t.tooltipEl.style("display","inline")}),r.on(`mouseover.${s}`,()=>{t.mouseInside=!0,t.content&&t.tooltipEl.style("display","inline")}),r.on(`mouseout.${s}`,()=>{t.mouseInside=!1,t.tooltipEl.style("display","none")})},update:function(e){e.tooltipEl.style("display",e.content&&e.mouseInside?"inline":"none"),e.content?e.content instanceof HTMLElement?(e.tooltipEl.text(""),e.tooltipEl.append(()=>e.content)):typeof e.content=="string"?e.tooltipEl.html(e.content):aI(e.content)?(e.tooltipEl.text(""),cI(e.content,e.tooltipEl.node())):(e.tooltipEl.style("display","none"),console.warn("Tooltip content is invalid, skipping.",e.content,e.content.toString())):e.tooltipEl.text("")}});function uI(e,t){t===void 0&&(t={});var n=t.insertAt;if(!(typeof document>"u")){var i=document.head||document.getElementsByTagName("head")[0],r=document.createElement("style");r.type="text/css",n==="top"&&i.firstChild?i.insertBefore(r,i.firstChild):i.appendChild(r),r.styleSheet?r.styleSheet.cssText=e:r.appendChild(document.createTextNode(e))}}var fI=`.scene-nav-info {
  position: absolute;
  bottom: 5px;
  width: 100%;
  text-align: center;
  color: slategrey;
  opacity: 0.7;
  font-size: 10px;
  font-family: sans-serif;
  pointer-events: none;
  user-select: none;
}

.scene-container canvas:focus {
  outline: none;
}`;uI(fI);var hb=e=>{e instanceof Array?e.forEach(hb):(e.map&&e.map.dispose(),e.dispose())},ub=e=>{e.geometry&&e.geometry.dispose(),e.material&&hb(e.material),e.texture&&e.texture.dispose(),e.children&&e.children.forEach(ub)},dI=e=>{for(;e.children.length;){let t=e.children[0];e.remove(t),ub(t)}},ae=window.THREE?window.THREE:{WebGLRenderer:Th,Scene:ea,PerspectiveCamera:Mn,Raycaster:er,SRGBColorSpace:We,TextureLoader:ma,Vector2:ut,Vector3:O,Box3:dn,Color:Wt,Mesh:Ge,SphereGeometry:Pi,MeshBasicMaterial:Er,BackSide:rn,Timer:os},Yp=Ur({props:{width:{default:window.innerWidth,onChange(e,t,n){isNaN(e)&&(t.width=n)}},height:{default:window.innerHeight,onChange(e,t,n){isNaN(e)&&(t.height=n)}},viewOffset:{default:[0,0]},backgroundColor:{default:"#000011"},backgroundImageUrl:{},onBackgroundImageLoaded:{},showNavInfo:{default:!0},skyRadius:{default:5e4},objects:{default:[]},lights:{default:[]},enablePointerInteraction:{default:!0,onChange(e,t){t.hoverObj=null,t.tooltip&&t.tooltip.content(null)},triggerUpdate:!1},pointerRaycasterThrottleMs:{default:50,triggerUpdate:!1},lineHoverPrecision:{default:1,triggerUpdate:!1},pointsHoverPrecision:{default:1,triggerUpdate:!1},hoverOrderComparator:{triggerUpdate:!1},hoverFilter:{default:()=>!0,triggerUpdate:!1},tooltipContent:{triggerUpdate:!1},hoverDuringDrag:{default:!1,triggerUpdate:!1},clickAfterDrag:{default:!1,triggerUpdate:!1},onHover:{default:()=>{},triggerUpdate:!1},onClick:{default:()=>{},triggerUpdate:!1},onRightClick:{triggerUpdate:!1}},methods:{tick:function(e){if(e.initialised){e.controls.enabled&&e.controls.update?.(Math.min(1,e.timer.update().getDelta())),e.postProcessingComposer?e.postProcessingComposer.render():e.renderer.render(e.scene,e.camera),e.extraRenderers.forEach(n=>n.render(e.scene,e.camera));let t=+new Date;if(e.enablePointerInteraction&&t-e.lastRaycasterCheck>=e.pointerRaycasterThrottleMs){e.lastRaycasterCheck=t;let n=null;if(e.hoverDuringDrag||!e.isPointerDragging){let i=this.intersectingObjects(e.pointerPos.x,e.pointerPos.y);e.hoverOrderComparator&&i.sort((s,o)=>e.hoverOrderComparator(s.object,o.object));let r=i.find(s=>e.hoverFilter(s.object))||null;n=r?r.object:null,e.intersection=r||null}n!==e.hoverObj&&(e.onHover(n,e.hoverObj,e.intersection),e.tooltip.content(n&&te(e.tooltipContent)(n,e.intersection)||null),e.hoverObj=n)}e.tweenGroup.update()}return this},getPointerPos:function(e){let{x:t,y:n}=e.pointerPos;return{x:t,y:n}},cameraPosition:function(e,t,n,i){let r=e.camera;if(t&&e.initialised){let c=t,l=n||{x:0,y:0,z:0};if(e.povPosTween?.end(),e.povTgtTween?.end(),!i)s(c),o(l);else{let h=Object.assign({},r.position),u=a();e.tweenGroup.add(e.povPosTween=new Np(h).to(c,i).easing($r.Quadratic.Out).onUpdate(s).onComplete(function(){e.povPosTween=void 0,e.tweenGroup.remove(this)}).start()),e.tweenGroup.add(e.povTgtTween=new Np(u).to(l,i/3).easing($r.Quadratic.Out).onUpdate(o).onComplete(function(){e.povTgtTween=void 0,e.tweenGroup.remove(this)}).start())}return this}return Object.assign({},r.position,{lookAt:a()});function s(c){let{x:l,y:h,z:u}=c;l!==void 0&&(r.position.x=l),h!==void 0&&(r.position.y=h),u!==void 0&&(r.position.z=u)}function o(c){let l=new ae.Vector3(c.x,c.y,c.z);e.controls.enabled&&e.controls.target?e.controls.target=l:r.lookAt(l)}function a(){return Object.assign(new ae.Vector3(0,0,-1e3).applyQuaternion(r.quaternion).add(r.position))}},zoomToFit:function(e,t=0,n=10,i,r){return this.fitToBbox(this.getBbox(i),t,n,r)},fitToBbox:function(e,t,n=0,i=10,r=!1){let s=e.camera;if(t){s.updateMatrixWorld();let o=new ae.Vector3,a=new ae.Vector3,c=new ae.Vector3,l=new ae.Vector3;s.getWorldPosition(l),s.getWorldDirection(c),o.crossVectors(c,s.up).normalize(),a.crossVectors(o,c).normalize();let u=(1-i*2/e.height)*s.fov/2*(Math.PI/180),d=Math.atan(Math.tan(u)*s.aspect),f=new ae.Vector3((t.x[0]+t.x[1])/2,(t.y[0]+t.y[1])/2,(t.z[0]+t.z[1])/2),p=r?c.clone().multiplyScalar(l.distanceTo(f)).add(l):f,_=Math.max(0,...[new ae.Vector3(t.x[0],t.y[0],t.z[0]),new ae.Vector3(t.x[0],t.y[0],t.z[1]),new ae.Vector3(t.x[0],t.y[1],t.z[0]),new ae.Vector3(t.x[0],t.y[1],t.z[1]),new ae.Vector3(t.x[1],t.y[0],t.z[0]),new ae.Vector3(t.x[1],t.y[0],t.z[1]),new ae.Vector3(t.x[1],t.y[1],t.z[0]),new ae.Vector3(t.x[1],t.y[1],t.z[1])].map(y=>{let x=y.clone().sub(p);return Math.max(Math.abs(x.dot(a))/Math.tan(u),Math.abs(x.dot(o))/Math.tan(d))-x.dot(c)})),g=c.clone().negate(),m={x:p.x+g.x*_,y:p.y+g.y*_,z:p.z+g.z*_};this.cameraPosition(m,p,n)}return this},getBbox:function(e,t=()=>!0){let n=new ae.Box3,i=e.objects.filter(t);return i.length?(i.forEach(r=>n.expandByObject(r)),Object.assign(...["x","y","z"].map(r=>({[r]:[n.min[r],n.max[r]]})))):null},getScreenCoords:function(e,t,n,i){let r=new ae.Vector3(t,n,i);return r.project(this.camera()),{x:(r.x+1)*e.width/2,y:-(r.y-1)*e.height/2}},getSceneCoords:function(e,t,n,i=0){let r=new ae.Vector2(t/e.width*2-1,-(n/e.height)*2+1),s=new ae.Raycaster;return s.setFromCamera(r,e.camera),Object.assign({},s.ray.at(i,new ae.Vector3))},intersectingObjects:function(e,t,n){let i=new ae.Vector2(t/e.width*2-1,-(n/e.height)*2+1),r=new ae.Raycaster;return r.params.Line.threshold=e.lineHoverPrecision,r.params.Points.threshold=e.pointsHoverPrecision,r.setFromCamera(i,e.camera),r.intersectObjects(e.objects,!0)},renderer:e=>e.renderer,scene:e=>e.scene,camera:e=>e.camera,postProcessingComposer:e=>e.postProcessingComposer,controls:e=>e.controls,_destructor:function(e){dI(e.scene),e.controls?.dispose(),e.renderer?.dispose(),e.postProcessingComposer?.dispose()}},stateInit:()=>({scene:new ae.Scene,camera:new ae.PerspectiveCamera,timer:new ae.Timer,tweenGroup:new Dp,lastRaycasterCheck:0}),init(e,t,{controlType:n="trackball",useWebGPU:i=!1,rendererConfig:r={},extraRenderers:s=[],waitForLoadComplete:o=!0}={}){e.innerHTML="",e.appendChild(t.container=document.createElement("div")),t.container.className="scene-container",t.container.style.position="relative",t.container.appendChild(t.navInfo=document.createElement("div")),t.navInfo.className="scene-nav-info",t.navInfo.textContent={orbit:"Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan",trackball:"Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan",arcball:"Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan",fly:"WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw"}[n]||"",t.navInfo.style.display=t.showNavInfo?null:"none",t.tooltip=new lb(t.container),t.pointerPos=new ae.Vector2,t.pointerPos.x=-2,t.pointerPos.y=-2,["pointermove","pointerdown"].forEach(a=>t.container.addEventListener(a,c=>{if(a==="pointerdown"&&(t.isPointerPressed=!0),!t.isPointerDragging&&c.type==="pointermove"&&(c.pressure>0||t.isPointerPressed)&&(c.pointerType==="mouse"||c.movementX===void 0||[c.movementX,c.movementY].some(h=>Math.abs(h)>1))&&(t.isPointerDragging=!0),t.enablePointerInteraction){let h=l(t.container);t.pointerPos.x=c.pageX-h.left,t.pointerPos.y=c.pageY-h.top}function l(h){let u=h.getBoundingClientRect(),d=window.pageXOffset||document.documentElement.scrollLeft,f=window.pageYOffset||document.documentElement.scrollTop;return{top:u.top+f,left:u.left+d}}},{passive:!0})),t.container.addEventListener("pointerup",a=>{t.isPointerPressed&&(t.isPointerPressed=!1,!(t.isPointerDragging&&(t.isPointerDragging=!1,!t.clickAfterDrag))&&requestAnimationFrame(()=>{a.button===0&&t.onClick(t.hoverObj||null,a,t.intersection),a.button===2&&t.onRightClick&&t.onRightClick(t.hoverObj||null,a,t.intersection)}))},{passive:!0,capture:!0}),t.container.addEventListener("contextmenu",a=>{t.onRightClick&&a.preventDefault()}),t.renderer=new(i?nu:ae.WebGLRenderer)(Object.assign({antialias:!0,alpha:!0},r)),t.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio)),t.container.appendChild(t.renderer.domElement),t.extraRenderers=s,t.extraRenderers.forEach(a=>{a.domElement.style.position="absolute",a.domElement.style.top="0px",a.domElement.style.pointerEvents="none",t.container.appendChild(a.domElement)}),t.postProcessingComposer=new yu(t.renderer),t.postProcessingComposer.addPass(new vu(t.scene,t.camera)),t.controls=new(pI(n)?n:{trackball:lu,arcball:uu,orbit:du,fly:pu}[n])(t.camera,t.renderer.domElement),n==="fly"&&(t.controls.movementSpeed=300,t.controls.rollSpeed=Math.PI/6,t.controls.dragToLook=!0),(n==="trackball"||n==="arcball"||n==="orbit")&&(t.controls.minDistance=.1,t.controls.maxDistance=t.skyRadius,t.controls.addEventListener("start",()=>{t.controlsEngaged=!0}),t.controls.addEventListener("change",()=>{t.controlsEngaged&&(t.controlsDragging=!0)}),t.controls.addEventListener("end",()=>{t.controlsEngaged=!1,t.controlsDragging=!1}),t.renderer.domElement.style.cursor=null),[t.renderer,t.postProcessingComposer,...t.extraRenderers].forEach(a=>a.setSize(t.width,t.height)),t.camera.aspect=t.width/t.height,t.camera.updateProjectionMatrix(),t.camera.position.z=1e3,t.scene.add(t.skysphere=new ae.Mesh),t.skysphere.visible=!1,t.loadComplete=t.scene.visible=!o,window.scene=t.scene},update(e,t){if(e.width&&e.height&&(t.hasOwnProperty("width")||t.hasOwnProperty("height"))){let i=e.width,r=e.height;e.container.style.width=`${i}px`,e.container.style.height=`${r}px`,[e.renderer,e.postProcessingComposer,...e.extraRenderers].forEach(o=>o.setSize(i,r)),e.camera.aspect=i/r;let s=e.viewOffset.slice(0,2);s.some(o=>o)&&e.camera.setViewOffset(i,r,...s,i,r),e.camera.updateProjectionMatrix()}if(t.hasOwnProperty("viewOffset")){let i=e.width,r=e.height,s=e.viewOffset.slice(0,2);s.some(o=>o)?e.camera.setViewOffset(i,r,...s,i,r):e.camera.clearViewOffset()}if(t.hasOwnProperty("skyRadius")&&e.skyRadius&&(e.controls.hasOwnProperty("maxDistance")&&t.skyRadius&&(e.controls.maxDistance=Math.min(e.controls.maxDistance,e.skyRadius)),e.camera.far=e.skyRadius*2.5,e.camera.updateProjectionMatrix(),e.skysphere.geometry=new ae.SphereGeometry(e.skyRadius)),t.hasOwnProperty("backgroundColor")){let i=Vr(e.backgroundColor).alpha;i===void 0&&(i=1),e.renderer.setClearColor(new ae.Color(Nv(1,e.backgroundColor)),i)}t.hasOwnProperty("backgroundImageUrl")&&(e.backgroundImageUrl?new ae.TextureLoader().load(e.backgroundImageUrl,i=>{i.colorSpace=ae.SRGBColorSpace,e.skysphere.material=new ae.MeshBasicMaterial({map:i,side:ae.BackSide}),e.skysphere.visible=!0,e.onBackgroundImageLoaded&&setTimeout(e.onBackgroundImageLoaded),!e.loadComplete&&n()}):(e.skysphere.visible=!1,e.skysphere.material.map=null,!e.loadComplete&&n())),t.hasOwnProperty("showNavInfo")&&(e.navInfo.style.display=e.showNavInfo?null:"none"),t.hasOwnProperty("lights")&&((t.lights||[]).forEach(i=>e.scene.remove(i)),e.lights.forEach(i=>e.scene.add(i))),t.hasOwnProperty("objects")&&((t.objects||[]).forEach(i=>e.scene.remove(i)),e.objects.forEach(i=>e.scene.add(i)));function n(){e.loadComplete=e.scene.visible=!0}}});function pI(e){return typeof e=="function"&&Function.prototype.toString.call(e).startsWith("class")}function mI(e,t){t===void 0&&(t={});var n=t.insertAt;if(!(typeof document>"u")){var i=document.head||document.getElementsByTagName("head")[0],r=document.createElement("style");r.type="text/css",n==="top"&&i.firstChild?i.insertBefore(r,i.firstChild):i.appendChild(r),r.styleSheet?r.styleSheet.cssText=e:r.appendChild(document.createTextNode(e))}}var gI=`.graph-info-msg {
  top: 50%;
  width: 100%;
  text-align: center;
  color: lavender;
  opacity: 0.7;
  font-size: 22px;
  position: absolute;
  font-family: Sans-serif;
}

.scene-container .clickable {
  cursor: pointer;
}

.scene-container .grabbable {
  cursor: move;
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
}

.scene-container .grabbable:active {
  cursor: grabbing;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
}`;mI(gI);function fb(e,t){let n=new t;return n._destructor&&n._destructor(),{linkProp:function(i){return{default:n[i](),onChange(r,s){s[e][i](r)},triggerUpdate:!1}},linkMethod:function(i){return function(r,...s){let o=r[e],a=o[i](...s);return a===o?this:a}}}}var Zp=window.THREE?window.THREE:{AmbientLight:va,DirectionalLight:ya,REVISION:"187"},_I=170,db=fb("forceGraph",_p),yI=Object.assign(...["jsonUrl","graphData","numDimensions","dagMode","dagLevelDistance","dagNodeFilter","onDagError","nodeRelSize","nodeId","nodeVal","nodeResolution","nodeColor","nodeAutoColorBy","nodeOpacity","nodeVisibility","nodeThreeObject","nodeThreeObjectExtend","nodePositionUpdate","linkSource","linkTarget","linkVisibility","linkColor","linkAutoColorBy","linkOpacity","linkWidth","linkResolution","linkCurvature","linkCurveRotation","linkMaterial","linkThreeObject","linkThreeObjectExtend","linkPositionUpdate","linkDirectionalArrowLength","linkDirectionalArrowColor","linkDirectionalArrowRelPos","linkDirectionalArrowResolution","linkDirectionalParticles","linkDirectionalParticleSpeed","linkDirectionalParticleOffset","linkDirectionalParticleWidth","linkDirectionalParticleColor","linkDirectionalParticleResolution","linkDirectionalParticleThreeObject","forceEngine","d3AlphaDecay","d3VelocityDecay","d3AlphaMin","ngraphPhysics","warmupTicks","cooldownTicks","cooldownTime","onEngineTick","onEngineStop"].map(e=>({[e]:db.linkProp(e)}))),vI=Object.assign(...["refresh","getGraphBbox","d3Force","d3ReheatSimulation","emitParticle"].map(e=>({[e]:db.linkMethod(e)}))),Du=fb("renderObjs",Yp),bI=Object.assign(...["width","height","backgroundColor","showNavInfo","enablePointerInteraction"].map(e=>({[e]:Du.linkProp(e)}))),xI=Object.assign(...["lights","cameraPosition","postProcessingComposer"].map(e=>({[e]:Du.linkMethod(e)})),{graph2ScreenCoords:Du.linkMethod("getScreenCoords"),screen2GraphCoords:Du.linkMethod("getSceneCoords")}),pb=Ur({props:{nodeLabel:{default:"name",triggerUpdate:!1},linkLabel:{default:"name",triggerUpdate:!1},linkHoverPrecision:{default:1,onChange:(e,t)=>t.renderObjs.lineHoverPrecision(e),triggerUpdate:!1},enableNavigationControls:{default:!0,onChange(e,t){let n=t.renderObjs.controls();n&&(n.enabled=e,e&&n.domElement&&n.domElement.dispatchEvent(new PointerEvent("pointerup")))},triggerUpdate:!1},enableNodeDrag:{default:!0,triggerUpdate:!1},onNodeDrag:{default:()=>{},triggerUpdate:!1},onNodeDragEnd:{default:()=>{},triggerUpdate:!1},onNodeClick:{triggerUpdate:!1},onNodeRightClick:{triggerUpdate:!1},onNodeHover:{triggerUpdate:!1},onLinkClick:{triggerUpdate:!1},onLinkRightClick:{triggerUpdate:!1},onLinkHover:{triggerUpdate:!1},onBackgroundClick:{triggerUpdate:!1},onBackgroundRightClick:{triggerUpdate:!1},showPointerCursor:{default:!0,triggerUpdate:!1},...yI,...bI},methods:{zoomToFit:function(e,t,n,...i){return e.renderObjs.fitToBbox(e.forceGraph.getGraphBbox(...i),t,n),this},pauseAnimation:function(e){return e.animationFrameRequestId!==null&&(cancelAnimationFrame(e.animationFrameRequestId),e.animationFrameRequestId=null),this},resumeAnimation:function(e){return e.animationFrameRequestId===null&&this._animationCycle(),this},_animationCycle(e){e.enablePointerInteraction&&(this.renderer().domElement.style.cursor=null),e.forceGraph.tickFrame(),e.renderObjs.tick(),e.animationFrameRequestId=requestAnimationFrame(this._animationCycle)},scene:e=>e.renderObjs.scene(),camera:e=>e.renderObjs.camera(),renderer:e=>e.renderObjs.renderer(),controls:e=>e.renderObjs.controls(),_destructor:function(e){this.pauseAnimation(),this.graphData({nodes:[],links:[]}),e.forceGraph._destructor?.(),e.renderObjs._destructor()},...vI,...xI},stateInit:({controlType:e,rendererConfig:t,extraRenderers:n})=>{let i=new _p;return{forceGraph:i,renderObjs:Yp({controlType:e,rendererConfig:t,extraRenderers:n}).objects([i]).lights([new Zp.AmbientLight(13421772,Math.PI),new Zp.DirectionalLight(16777215,.6*Math.PI)])}},init:function(e,t){e.innerHTML="",e.appendChild(t.container=document.createElement("div")),t.container.style.position="relative";let n=document.createElement("div");t.container.appendChild(n),t.renderObjs(n);let i=t.renderObjs.camera(),r=t.renderObjs.renderer(),s=t.renderObjs.controls();s.enabled=!!t.enableNavigationControls,t.lastSetCameraZ=i.position.z;let o;t.container.appendChild(o=document.createElement("div")),o.className="graph-info-msg",o.textContent="",t.forceGraph.onLoading(()=>{o.textContent="Loading..."}).onFinishLoading(()=>{o.textContent=""}).onUpdate(()=>{t.graphData=t.forceGraph.graphData(),i.position.x===0&&i.position.y===0&&i.position.z===t.lastSetCameraZ&&t.graphData.nodes.length&&(i.lookAt(t.forceGraph.position),t.lastSetCameraZ=i.position.z=Math.cbrt(t.graphData.nodes.length)*_I)}).onFinishUpdate(()=>{if(t._dragControls){let a=t.graphData.nodes.find(c=>c.__initialFixedPos&&!c.__disposeControlsAfterDrag);a?a.__disposeControlsAfterDrag=!0:t._dragControls.dispose(),t._dragControls=void 0}if(t.enableNodeDrag&&t.enablePointerInteraction&&t.forceEngine==="d3"){let a=t._dragControls=new Ih(t.graphData.nodes.map(c=>c.__threeObj).filter(c=>c),i,r.domElement);a.addEventListener("dragstart",function(c){let l=ur(c.object);if(!l)return;s.enabled=!1,c.object.__initialPos=c.object.position.clone(),c.object.__prevPos=c.object.position.clone();let h=l.__data;!h.__initialFixedPos&&(h.__initialFixedPos={fx:h.fx,fy:h.fy,fz:h.fz}),!h.__initialPos&&(h.__initialPos={x:h.x,y:h.y,z:h.z}),["x","y","z"].forEach(u=>h[`f${u}`]=h[u]),r.domElement.classList.add("grabbable")}),a.addEventListener("drag",function(c){let l=ur(c.object);if(!l)return;if(!c.object.hasOwnProperty("__graphObjType")){let f=c.object.__initialPos,p=c.object.__prevPos,_=c.object.position;l.position.add(_.clone().sub(p)),p.copy(_),_.copy(f)}let h=l.__data,u=l.position,d={x:u.x-h.x,y:u.y-h.y,z:u.z-h.z};["x","y","z"].forEach(f=>h[`f${f}`]=h[f]=u[f]),t.forceGraph.d3AlphaTarget(.3).resetCountdown(),h.__dragged=!0,t.onNodeDrag(h,d)}),a.addEventListener("dragend",function(c){let l=ur(c.object);if(!l)return;delete c.object.__initialPos,delete c.object.__prevPos;let h=l.__data;h.__disposeControlsAfterDrag&&(a.dispose(),delete h.__disposeControlsAfterDrag);let u=h.__initialFixedPos,d=h.__initialPos,f={x:d.x-h.x,y:d.y-h.y,z:d.z-h.z};u&&(["x","y","z"].forEach(p=>{let _=`f${p}`;u[_]===void 0&&delete h[_]}),delete h.__initialFixedPos,delete h.__initialPos,h.__dragged&&(delete h.__dragged,t.onNodeDragEnd(h,f))),t.forceGraph.d3AlphaTarget(0).resetCountdown(),t.enableNavigationControls&&(s.enabled=!0,s._status&&s._onPointerCancel?.()),r.domElement.classList.remove("grabbable")})}}),Zp.REVISION<155&&(t.renderObjs.renderer().useLegacyLights=!1),t.renderObjs.hoverOrderComparator((a,c)=>{let l=ur(a);if(!l)return 1;let h=ur(c);if(!h)return-1;let u=d=>d.__graphObjType==="node";return u(h)-u(l)}).tooltipContent(a=>{let c=ur(a);return c&&te(t[`${c.__graphObjType}Label`])(c.__data)||""}).hoverDuringDrag(!1).onHover(a=>{let c=ur(a);if(c!==t.hoverObj){let l=t.hoverObj?t.hoverObj.__graphObjType:null,h=t.hoverObj?t.hoverObj.__data:null,u=c?c.__graphObjType:null,d=c?c.__data:null;if(l&&l!==u){let f=t[`on${l==="node"?"Node":"Link"}Hover`];f&&f(null,h)}if(u){let f=t[`on${u==="node"?"Node":"Link"}Hover`];f&&f(d,l===u?h:null)}r.domElement.classList[(c&&t[`on${u==="node"?"Node":"Link"}Click`]||!c&&t.onBackgroundClick)&&te(t.showPointerCursor)(d)?"add":"remove"]("clickable"),t.hoverObj=c}}).clickAfterDrag(!1).onClick((a,c)=>{let l=ur(a);if(l){let h=t[`on${l.__graphObjType==="node"?"Node":"Link"}Click`];h&&h(l.__data,c)}else t.onBackgroundClick&&t.onBackgroundClick(c)}).onRightClick((a,c)=>{let l=ur(a);if(l){let h=t[`on${l.__graphObjType==="node"?"Node":"Link"}RightClick`];h&&h(l.__data,c)}else t.onBackgroundRightClick&&t.onBackgroundRightClick(c)}),this._animationCycle()}});function ur(e){let t=e;for(;t&&!t.hasOwnProperty("__graphObjType");)t=t.parent;return t}var Io=["#3987e5","#d95926","#199e70","#c98500","#d55181","#008300","#9085e9","#e66767"],ai="#8d8c86",mb=e=>{let t=e.match(/^([A-Z]{2,}(?=_|$|[A-Z][a-z])|[A-Z]?[a-z0-9]+|[A-Z]+)/);return t?t[1]:e};function MI(e){if(e.s!=="dbo")return e.s;let t=e.n.split("_").filter(Boolean);return t.length?/^(tbl|vw|view|v)$/i.test(t[0])&&t.length>1?mb(t[1]):t.length>1?t[0]:mb(t[0]):e.n}function SI(e,t){let n=Array.from({length:e},(s,o)=>o),i=e,r=t;for(let s=0;s<12;s++){let o=Array.from({length:i},()=>new Map),a=new Float64Array(i),c=0;for(let[m,y,x]of r)m===y?a[m]+=2*x:(o[m].set(y,(o[m].get(y)||0)+x),o[y].set(m,(o[y].get(m)||0)+x),a[m]+=x,a[y]+=x),c+=2*x;if(!c)break;let l=Int32Array.from({length:i},(m,y)=>y),h=Float64Array.from(a),u=!1,d=!0,f=0;for(;d&&f++<40;){d=!1;for(let m=0;m<i;m++){let y=l[m],x=new Map;for(let[w,v]of o[m])x.set(l[w],(x.get(l[w])||0)+v);h[y]-=a[m];let b=y,S=(x.get(y)||0)-h[y]*a[m]/c;for(let[w,v]of x){let M=v-h[w]*a[m]/c;M>S+1e-10&&(S=M,b=w)}h[b]+=a[m],b!==y&&(l[m]=b,d=!0,u=!0)}}if(!u)break;let p=new Map;for(let m=0;m<i;m++)p.has(l[m])||p.set(l[m],p.size);let _=p.size;for(let m=0;m<e;m++)n[m]=p.get(l[n[m]]);let g=new Map;for(let[m,y,x]of r){let b=p.get(l[m]),S=p.get(l[y]);b>S&&([b,S]=[S,b]);let w=b*_+S;g.set(w,(g.get(w)||0)+x)}if(r=[...g].map(([m,y])=>[Math.floor(m/_),m%_,y]),_===i)break;i=_}return n}function gb(e){let t=e.tables,n=t.map((p,_)=>({id:_,t:p,name:p.n,schema:p.s,isView:p.k==="V",full:p.s==="dbo"?p.n:p.s+"."+p.n,cols:p.c.length,rows:p.r==null?null:p.r,out:[],inc:[],self:[],uses:[],usedBy:[],nbr:new Set,deg:0})),i=e.fks.map((p,_)=>({i:_,from:p[0],to:p[1],name:p[2],onDelete:p[3],disabled:!!p[4],cols:p[5]})),r=new Map,s=[];for(let p of i){let _=n[p.from],g=n[p.to];for(let[x]of p.cols){let b=_.t.c.find(S=>S[0]===x);b&&(b[2]|=16)}if(p.from===p.to){_.self.push(p);continue}_.out.push(p),g.inc.push(p),_.nbr.add(g.id),g.nbr.add(_.id);let m=p.from*t.length+p.to,y=r.get(m);y||(y={source:p.from,target:p.to,kind:"fk",fks:[],a:p.from,b:p.to},r.set(m,y),s.push(y)),y.fks.push(p)}n.forEach(p=>{p.deg=p.nbr.size});for(let p of n)if(p.t.dp)for(let _ of p.t.dp){let g=n[_];g&&(p.uses.push(_),g.usedBy.push(p.id),s.push({source:p.id,target:_,kind:"view",fks:[],a:p.id,b:_}))}n.forEach(p=>{p.ring=p.isView?p.uses.length===0:p.deg===0});let o=new Map;for(let p of n){let _=MI(p.t),g=_.toLowerCase(),m=o.get(g);m||(m={key:g,labels:new Map,nodes:[],tables:0},o.set(g,m)),m.labels.set(_,(m.labels.get(_)||0)+1),m.nodes.push(p),p.isView||m.tables++,p.module=m}let a=[...o.values()].sort((p,_)=>_.tables-p.tables||_.nodes.length-p.nodes.length||p.key.localeCompare(_.key));a.forEach((p,_)=>{p.label=[...p.labels].sort((g,m)=>m[1]-g[1])[0][0],p.color=_<Io.length?Io[_]:ai,p.rank=_});let c=s.filter(p=>p.kind==="fk").map(p=>[p.a,p.b,1]),l=SI(n.length,c),h=new Map;n.forEach((p,_)=>{if(p.isView||p.deg===0)return;let g=h.get(l[_]);g||(g={nodes:[]},h.set(l[_],g)),g.nodes.push(p),p.cluster=g});let u=[...h.values()].sort((p,_)=>_.nodes.length-p.nodes.length);u.forEach((p,_)=>{p.hub=p.nodes.reduce((g,m)=>m.deg>g.deg?m:g,p.nodes[0]),p.label=p.hub.full,p.key="c"+_,p.rank=_,p.color=_<Io.length?Io[_]:ai});for(let p of n){if(!p.isView||!p.uses.length)continue;let _=new Map;for(let y of p.uses){let x=n[y].cluster;x&&_.set(x,(_.get(x)||0)+1)}let g=null,m=0;for(let[y,x]of _)x>m&&(g=y,m=x);g&&(p.cluster=g)}let d=n.filter(p=>!p.isView),f={tables:d.length,views:n.length-d.length,columns:d.reduce((p,_)=>p+_.cols,0),fks:i.length,isolated:d.filter(p=>p.deg===0).length,rows:d.reduce((p,_)=>p+(_.rows||0),0)};return{nodes:n,links:s,fks:i,modules:a,clusters:u,stats:f,meta:e.meta}}function _b(e){let t=[],n=new Map,i=(a,c)=>{n.set(`${a.schema}.${a.name}`.toLowerCase(),t.length),t.push({s:a.schema,n:a.name,k:c,r:c==="U"?a.rows==null?0:a.rows:null,cr:(a.created||"").slice(0,10),md:(a.modified||"").slice(0,10),d:a.description||"",c:(a.columns||[]).map(l=>[l.name,l.type,(l.primaryKey?1:0)|(l.nullable?2:0)|(l.identity?4:0)|(l.computed?8:0),l.default==null?0:l.default,l.description||0,typeof l.computed=="string"?l.computed:0]),ix:(a.indexes||[]).map(l=>[l.name,(l.unique?1:0)|(/^CLUSTERED/.test(l.type||"")?2:0)|(l.primaryKey?4:0),(l.columns||[]).join(", "),(l.include||[]).join(", "),l.filter||""]),tg:a.triggers||[],ck:a.checks||[],rt:[],hidden:!!a.definitionHidden})},r=e.tables||[],s=e.views||[];r.forEach(a=>i(a,"U")),s.forEach(a=>i(a,"V"));let o=[];return r.forEach((a,c)=>(a.foreignKeys||[]).forEach(l=>{let h=n.get(`${l.references.schema}.${l.references.table}`.toLowerCase());if(h===void 0)return;let u=l.onDelete==="CASCADE"?1:l.onDelete==="SET_NULL"?2:l.onDelete==="SET_DEFAULT"?3:0;o.push([c,h,l.name,u,l.disabled?1:0,l.columns.map((d,f)=>[d,l.references.columns[f]])])})),s.forEach((a,c)=>{let l=(a.reads||[]).map(h=>n.get(h.toLowerCase())).filter(h=>h!==void 0);l.length&&(t[r.length+c].dp=l)}),(e.routines||[]).forEach(a=>(a.uses||[]).forEach(c=>{let l=n.get(c.toLowerCase());l!==void 0&&t[l].rt.push(a)})),{meta:{db:e.database,at:e.extractedAt,id:e.id,server:e.server,counts:e.counts||{}},tables:t,fks:o}}var vb=.02,bb=.004;function wI(e,t){let n=2166136261,i=r=>{for(let s=0;s<r.length;s++)n^=r.charCodeAt(s),n=Math.imul(n,16777619)};return e.forEach(r=>i(r.full+"|")),t.forEach(r=>i(r.a+">"+r.b+";")),(n>>>0).toString(36)+"."+e.length+"."+t.length}function Kp(e,t){let n=2166136261^t;for(let i=0;i<e.length;i++)n^=e.charCodeAt(i),n=Math.imul(n,16777619);return(n>>>0)/2147483648-1}function yb(e,t,n){let i=n.filter(r=>!t[r.a].ring&&!t[r.b].ring).map(r=>({source:t[r.a],target:t[r.b],kind:r.kind}));return za(e,3).alphaDecay(vb).velocityDecay(.38).alphaMin(bb).stop().force("charge",Ga().strength(r=>r.isView?-14:-(36+Math.min(r.deg,80)*2)).distanceMax(1e3).theta(.9)).force("link",Oa(i).distance(r=>r.kind==="view"?50:30+3*Math.sqrt(Math.min(r.source.deg,r.target.deg))).strength(r=>{if(r.kind==="view")return .1;let s=Math.max(1,r.source.deg),o=Math.max(1,r.target.deg);return 1/Math.min(s,o)/(1+.6*Math.log10(Math.max(s,o)))})).force("gx",Od(0).strength(.035)).force("gy",Fd(0).strength(.055)).force("gz",Ud(0).strength(.035))}async function Jp(e,t,n,i=0,r=1){let s=performance.now();for(let o=0;o<t;o++)e.tick(),performance.now()-s>45&&(n(i+o/t*r),await new Promise(a=>setTimeout(a,0)),s=performance.now())}async function xb(e,t,n,i){let r="db3d.layout.v3."+i,s=wI(e,t),o=e.filter(d=>!d.ring),a=null;try{a=JSON.parse(localStorage.getItem(r)||"null")}catch{}let c=()=>{o.forEach(d=>{d.x=Math.round(d.x*10)/10,d.y=Math.round(d.y*10)/10,d.z=Math.round(d.z*10)/10,delete d.fx,delete d.fy,delete d.fz});try{localStorage.setItem(r,JSON.stringify({sig:s,names:o.map(d=>d.full),p:o.flatMap(d=>[d.x,d.y,d.z])}))}catch{}},l=new Map;if(a&&Array.isArray(a.names)&&a.p&&a.p.length===a.names.length*3&&a.names.forEach((d,f)=>l.set(d,f)),a&&a.sig===s&&l.size===o.length)return o.forEach(d=>{let f=l.get(d.full);d.x=a.p[f*3],d.y=a.p[f*3+1],d.z=a.p[f*3+2]}),"cached";let h=o.filter(d=>l.has(d.full));if(h.length>=o.length*.6){h.forEach(_=>{let g=l.get(_.full);_.x=_.fx=a.p[g*3],_.y=_.fy=a.p[g*3+1],_.z=_.fz=a.p[g*3+2]});let d=new Set(h),f=new Map;for(let _ of t){let g=e[_.a],m=e[_.b];d.has(g)&&!d.has(m)&&!m.ring&&(f.get(m)||f.set(m,[]).get(m)).push(g),d.has(m)&&!d.has(g)&&!g.ring&&(f.get(g)||f.set(g,[]).get(g)).push(m)}for(let _ of o){if(d.has(_))continue;let g=f.get(_)||[],m=g.reduce((x,b)=>[x[0]+b.x,x[1]+b.y,x[2]+b.z],[0,0,0]).map(x=>g.length?x/g.length:0),y=g.length?22:120;_.x=m[0]+Kp(_.full,1)*y,_.y=m[1]+Kp(_.full,2)*y,_.z=m[2]+Kp(_.full,3)*y}let p=yb(o,e,t);return p.alpha(.3),await Jp(p,80,n,0,.8),h.forEach(_=>{delete _.fx,delete _.fy,delete _.fz}),p.alpha(.03),await Jp(p,20,n,.8,.2),n(1),c(),"updated"}let u=yb(o,e,t);return await Jp(u,Math.ceil(Math.log(bb)/Math.log(1-vb)),n),n(1),c(),"new"}var Eb="#f0efec",Tb="#c3c2b7",Mb="#898781",oc='"Segoe UI", Vazirmatn, Tahoma, sans-serif',tm='Consolas, "Cascadia Mono", "Courier New", monospace',sc=new Map,ac=42,Ab=e=>`${e==="name"?600:500} ${e==="fk"?26:30}px ${e==="fk"?tm:oc}`,Sb=document.createElement("canvas").getContext("2d");function lc(e,t="name"){return Sb.font=Ab(t),(Math.ceil(Sb.measureText(e).width)+18)/ac}function Uu(e,t="name"){let n=t+"|"+e,i=sc.get(n);if(!i){let s=document.createElement("canvas"),o=s.getContext("2d"),a=Ab(t);o.font=a;let c=Math.ceil(o.measureText(e).width)+18;s.width=c,s.height=ac,o.font=a,o.textBaseline="middle",o.lineJoin="round",o.lineWidth=7,o.strokeStyle="rgba(8,10,14,0.9)",o.strokeText(e,9,ac/2+1),o.fillStyle=t==="name"?Eb:Tb,o.fillText(e,9,ac/2+1);let l=new is(s);if(l.colorSpace=We,l.anisotropy=4,i={mat:new Sr({map:l,transparent:!0,depthWrite:!1,sizeAttenuation:!1}),aspect:c/ac},sc.set(n,i),sc.size>900){let u=sc.entries();for(let d=0;d<200;d++){let[f,p]=u.next().value;p.mat.map.dispose(),p.mat.dispose(),sc.delete(f)}}}let r=new ns(i.mat);return r.userData.aspect=i.aspect,r}function ku(e,t){e.scale.set(t*e.userData.aspect,t,1)}var Cn=460,ci=48,Bi=23,fr=12,Nu=1.25,Fu=.085;function Qp(e,t,n){if(e.measureText(t).width<=n)return t;let i=0,r=t.length;for(;i<r;){let s=i+r+1>>1;e.measureText(t.slice(0,s)+"\u2026").width<=n?i=s:r=s-1}return t.slice(0,i)+"\u2026"}function wb(e,t,n,i,r,s){e.beginPath(),e.moveTo(t+s,n),e.arcTo(t+i,n,t+i,n+r,s),e.arcTo(t+i,n+r,t,n+r,s),e.arcTo(t,n+r,t,n,s),e.arcTo(t,n,t+i,n,s),e.closePath()}function Cb(e,t,n,i,r=1){let s=e.t,o=s.c;if(o.length>n){let y=new Set;o.forEach((x,b)=>{x[2]&17&&y.size<n&&y.add(b)}),o.forEach((x,b)=>{y.size<n&&y.add(b)}),o=o.filter((x,b)=>y.has(b))}let a=s.c.length-o.length,c=ci+o.length*Bi+(a?26:8),l=document.createElement("canvas");l.width=Math.round(Cn*Nu),l.height=Math.round(c*Nu);let h=l.getContext("2d");h.scale(Nu,Nu),wb(h,1,1,Cn-2,c-2,10),h.fillStyle="rgba(17,19,25,0.96)",h.fill(),h.save(),h.clip(),h.fillStyle=t,h.fillRect(0,0,Cn,ci),h.fillStyle="rgba(0,0,0,0.18)",h.fillRect(0,ci-1,Cn,1),h.textBaseline="middle";let u=e.isView?"VIEW":e.rows!=null?e.rows.toLocaleString("en-US")+" rows":"";h.font=`500 12px ${oc}`,h.fillStyle="rgba(255,255,255,0.88)",h.textAlign="right";let d=u?h.measureText(u).width+10:0;u&&h.fillText(u,Cn-fr,ci/2+8),h.fillText(`${s.c.length} cols`,Cn-fr,ci/2-8),h.textAlign="left",h.fillStyle="#ffffff",h.font=`700 18px ${oc}`,h.fillText(Qp(h,e.full,Cn-2*fr-Math.max(d,60)),fr,ci/2+1),o.forEach((y,x)=>{let b=ci+x*Bi;x%2&&(h.fillStyle="rgba(255,255,255,0.035)",h.fillRect(0,b,Cn,Bi));let S=y[2]&1,w=y[2]&16;h.font=`700 10px ${oc}`,S&&(h.fillStyle="#e3b341",h.fillText("PK",fr,b+Bi/2+1)),w&&(h.fillStyle="#7fb2f5",h.fillText("FK",fr+(S?17:0),b+Bi/2+1)),h.font=`13px ${tm}`,h.fillStyle=Mb,h.textAlign="right";let v=Qp(h,y[1],130),M=h.measureText(v).width;h.fillText(v,Cn-fr,b+Bi/2+1),h.textAlign="left",h.font=`${S?700:400} 14px ${tm}`,h.fillStyle=y[2]&2?Tb:Eb,h.fillText(Qp(h,y[0],Cn-fr-44-M-14),fr+40,b+Bi/2+1)}),a&&(h.font=`500 12px ${oc}`,h.fillStyle=Mb,h.textAlign="center",h.fillText(`+ ${a} more columns`,Cn/2,ci+o.length*Bi+13)),h.restore(),wb(h,1,1,Cn-2,c-2,10),h.lineWidth=i?2.5:1,h.strokeStyle=i?"#ffffff":"rgba(255,255,255,0.22)",h.stroke();let f=new is(l);f.colorSpace=We,f.anisotropy=4;let p=new Sr({map:f,transparent:!0,depthWrite:!1,depthTest:!i}),_=new ns(p),g=Cn*Fu*r,m=c*Fu*r;return _.scale.set(g,m,1),_.center.set(-(e.radius+2.5)/g,1-ci/2/c),i&&(_.renderOrder=20),_.userData.card=!0,_}function Rb(e){e.material.map.dispose(),e.material.dispose()}function Pb(){let e=document.createElement("canvas");e.width=e.height=160;let t=e.getContext("2d");t.strokeStyle="#ffffff",t.lineWidth=7,t.beginPath(),t.arc(80,80,66,0,Math.PI*2),t.stroke();let n=new is(e);n.colorSpace=We;let i=new ns(new Sr({map:n,transparent:!0,depthWrite:!1,depthTest:!1,opacity:.9}));return i.renderOrder=15,i.raycast=()=>{},i}var Dt=e=>document.querySelector(e),Zt=e=>Number(e).toLocaleString("fa-IR"),ft=e=>String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),dr=(e,t)=>e.length>t?e.slice(0,t-1)+"\u2026":e,Lo=e=>{try{return new Date(e).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"})}catch{return e}};function Ib(e){let t=Math.max(0,(Date.now()-new Date(e).getTime())/1e3);return t<50?"\u0686\u0646\u062F \u0644\u062D\u0638\u0647 \u067E\u06CC\u0634":t<3600?`${Zt(Math.round(t/60))} \u062F\u0642\u06CC\u0642\u0647 \u067E\u06CC\u0634`:t<86400?`${Zt(Math.round(t/3600))} \u0633\u0627\u0639\u062A \u067E\u06CC\u0634`:`${Zt(Math.round(t/86400))} \u0631\u0648\u0632 \u067E\u06CC\u0634`}function Lb(e,t){let n=gb(e),{nodes:i,links:r}=n,s=Io.length,o="#0a0c11",a=3.2,c={colorMode:"cluster",sizeMode:"deg",showIsolated:!0,showViews:!1,showLabels:!0,showCards:!0,showFlow:!0,autoRotate:!0,selected:null,spot:null,hops:1},l=null,h=[],u=[],d=0,f=D=>c.colorMode==="cluster"?D.cluster:D.module,p=D=>{let j=f(D);return j?j.color:ai},_=D=>(c.showViews||!D.isView)&&(c.showIsolated||!D.ring),g=D=>(D.kind!=="view"||c.showViews)&&_(i[D.a])&&_(i[D.b]),m=D=>c.selected&&(D.a===c.selected.id||D.b===c.selected.id);function y(D){let j=[...D.nbr];return c.showViews&&j.push(...D.uses,...D.usedBy),j.map(H=>i[H]).filter(_)}function x(){let D=c.selected;D&&c.caseSet?l=new Set([D,...[...c.caseSet].filter(_)]):D?(l=new Set([D]),y(D).forEach(j=>l.add(j)),c.hops===2&&[...l].forEach(j=>y(j).forEach(H=>l.add(H)))):c.spot?l=new Set(c.spot.nodes.filter(_)):l=null,h=l?[...l].sort((j,H)=>H.deg-j.deg):[],u=i.filter(_),d=D?r.filter(j=>m(j)&&g(j)).length:0}function b(D){let j;c.sizeMode==="cols"?j=.5+D.cols/6:c.sizeMode==="rows"?j=.6+Math.pow(Math.log10((D.rows||0)+1),3)/4:j=1+(D.isView?D.uses.length*.5:D.deg*.9),D.val=j,D.radius=Math.cbrt(j)*a}function S(D){let j=f(D);return`<div class="tip"><div class="tip-n mono">${ft(D.full)}</div><div class="tip-m">${D.isView?"\u0648\u06CC\u0648":"\u062C\u062F\u0648\u0644"} \xB7 ${Zt(D.cols)} \u0633\u062A\u0648\u0646${D.rows!=null?" \xB7 "+Zt(D.rows)+" \u0631\u062F\u06CC\u0641":""} \xB7 ${Zt(D.isView?D.uses.length:D.deg)} ${D.isView?"\u0645\u0646\u0628\u0639":"\u062C\u062F\u0648\u0644 \u0645\u0631\u062A\u0628\u0637"}</div>`+(j?`<div class="tip-m"><i class="dot" style="background:${j.color}"></i>${c.colorMode==="cluster"?"\u062E\u0648\u0634\u0647\u0654":"\u0645\u0627\u0698\u0648\u0644"} <span class="mono">${ft(j.label)}</span></div>`:"")+(D.t.d?`<div class="tip-d" dir="auto">${ft(dr(D.t.d,170))}</div>`:"")+"</div>"}function w(D){let j=i[D.a],H=i[D.b];if(D.kind==="view")return`<div class="tip"><div class="tip-m">\u0648\u06CC\u0648 <span class="mono">${ft(j.name)}</span> \u0627\u0632 <span class="mono">${ft(H.name)}</span> \u0645\u06CC\u200C\u062E\u0648\u0627\u0646\u062F</div></div>`;let Z=D.fks.slice(0,6).map($=>`<div class="tip-fk mono">${$.cols.map(([J,lt])=>`${ft(j.name)}.<b>${ft(J)}</b> \u2192 ${ft(H.name)}.<b>${ft(lt)}</b>`).join("<br>")}</div>`).join("");return`<div class="tip"><div class="tip-m">\u06A9\u0644\u06CC\u062F \u062E\u0627\u0631\u062C\u06CC${D.fks.length>1?" ("+Zt(D.fks.length)+" \u0645\u0648\u0631\u062F)":""}</div>${Z}${D.fks.length>6?'<div class="tip-m">\u2026</div>':""}</div>`}let v=i.filter(D=>D.ring),M=3,U=2,P=15,k=[],C=1,N=900,T=700;(function(){let j=new Map;v.forEach(J=>{j.has(J.module)||j.set(J.module,[]),j.get(J.module).push(J)});let H=[...j].filter(([,J])=>J.length>=4).sort((J,lt)=>lt[1].length-J[1].length),Z=[...j].filter(([,J])=>J.length<4).flatMap(([,J])=>J),$=0;for(let[J,lt]of[...H.map(([K,ct])=>[K.label,ct]),["",Z]]){if(!lt.length)continue;lt.sort((ct,at)=>ct.module.rank-at.module.rank||ct.name.localeCompare(at.name));let K=$;lt.forEach((ct,at)=>{ct.ringSlot=$+Math.floor(at/M),ct.ringRow=at%M}),$+=Math.ceil(lt.length/M),k.push({label:J,mid:(K+$-1)/2,count:lt.length}),$+=U}C=Math.max(1,$)})();function I(){let D=[];for(let j of i)j.ring||D.push(Math.hypot(j.x,j.z));D.sort((j,H)=>j-H),T=D.length?D[Math.floor(D.length*.97)]:300,N=Math.max(520,(D.length?D[D.length-1]:300)*1.04+70);for(let j of v){let H=j.ringSlot/C*Math.PI*2,Z=N+j.ringRow*P;j.x=Math.cos(H)*Z,j.z=Math.sin(H)*Z,j.y=0}for(let j of k){let H=j.mid/C*Math.PI*2,Z=N+M*P+16;j.pos=new O(Math.cos(H)*Z,0,Math.sin(H)*Z)}}return B();async function B(){i.forEach(b),x(),Dt("#loading-text").textContent=`\u0686\u06CC\u062F\u0645\u0627\u0646 ${Zt(i.length)} \u062C\u062F\u0648\u0644 \u0648 \u0648\u06CC\u0648 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0631\u0627\u0628\u0637\u0647\u200C\u0647\u0627\u06CC\u0634\u0627\u0646\u2026`,await new Promise(z=>setTimeout(z,30)),await xb(i,r,z=>{Dt("#loading .bar i").style.width=(z*100).toFixed(0)+"%"},t.cacheId||n.meta.id||n.meta.db),I(),i.forEach(z=>{z.fx=z.x,z.fy=z.y,z.fz=z.z});let D="#7fb2f5",j="#f2a65a",H="#d9d7cf",Z=new Pi(1,8,6),$=new Er({visible:!1});function J(z){let rt=new In,Q=new Ge(Z,$);return Q.scale.setScalar(Math.max(3.6,z.radius*1.15)),rt.add(Q),z.__proxy=Q,rt}let lt=z=>z.kind==="view"?H:z.a===c.selected?.id?D:j,K=z=>!!m(z)&&g(z)&&(!c.caseSet||l.has(i[z.a])&&l.has(i[z.b])),ct=()=>d>60,at=new pb(Dt("#scene"),{controlType:"orbit",rendererConfig:{antialias:!0,alpha:!1,powerPreference:"high-performance"}});at.backgroundColor(o).showNavInfo(!1).nodeId("id").nodeRelSize(a).nodeVal(z=>z.val).nodeVisibility(_).nodeLabel(S).nodeThreeObject(J).linkVisibility(K).linkColor(lt).linkOpacity(1).linkWidth(()=>ct()?0:.45).linkDirectionalParticles(()=>c.showFlow?ct()?1:3:0).linkDirectionalParticleWidth(1.4).linkDirectionalParticleSpeed(.007).linkDirectionalParticleColor(()=>"#ffffff").linkDirectionalArrowLength(()=>ct()?0:3.5).linkDirectionalArrowRelPos(1).linkDirectionalArrowColor(lt).linkLabel(w).linkHoverPrecision(2).enableNodeDrag(!1).warmupTicks(0).cooldownTicks(0).onNodeClick(z=>$t(z)).onLinkClick(z=>{let rt=c.selected;$t(i[rt&&rt.id===z.a?z.b:rt&&rt.id===z.b?z.a:z.b])}).onBackgroundClick(()=>{c.selected?$t(null):c.spot&&Nt(null)}).graphData({nodes:i,links:r});let Pt=at.scene(),_t=at.camera(),Bt=at.controls(),Pe=new ta(o,2e3,6e3);Pt.fog=Pe,Bt.enableDamping=!0,Bt.dampingFactor=.14,Bt.autoRotate=!0,Bt.autoRotateSpeed=.3,Bt.minDistance=12,Bt.maxDistance=14e3,Bt.zoomSpeed=1.3;let Ht=i.filter(z=>!z.isView),he=i.filter(z=>z.isView),ge=new to(new Pi(1,12,8),new Ar,Math.max(1,Ht.length)),ie=new to(new ua(1,0),new Ar({flatShading:!0}),Math.max(1,he.length));for(let z of[ge,ie])z.frustumCulled=!1,z.raycast=()=>{},Pt.add(z);let He=new Wt(o),Ne=new Wt,Qe=new Vt;function Te(){let z=(rt,Q,E)=>{Q.forEach((R,W)=>{let F=_(R)?R.radius*E:0;Qe.makeScale(F,F,F).setPosition(R.x,R.y,R.z),rt.setMatrixAt(W,Qe),Ne.set(p(R)),l&&!l.has(R)&&Ne.lerp(He,.9),rt.setColorAt(W,Ne)}),rt.count=Q.length,rt.instanceMatrix.needsUpdate=!0,rt.instanceColor&&(rt.instanceColor.needsUpdate=!0)};z(ge,Ht,1),z(ie,he,1.3)}let Un=new Float32Array(r.length*6),Ue=new Float32Array(r.length*8),Xe=new Ae;Xe.setAttribute("position",new en(Un,3)),Xe.setAttribute("color",new en(Ue,4));let on=new eo(Xe,new Hn({vertexColors:!0,transparent:!0,depthWrite:!1}));on.frustumCulled=!1,on.raycast=()=>{},Pt.add(on);let Rn=new Wt("rgb(150,170,205)"),q=new Wt("rgb(225,220,205)");function yn(){r.forEach((z,rt)=>{let Q=i[z.a],E=i[z.b],R;!g(z)||m(z)?R=0:l?R=l.has(Q)&&l.has(E)?c.selected?.16:.5:.022:R=z.kind==="view"?.13:.2;let W=z.kind==="view"?q:Rn;Un.set([Q.x,Q.y,Q.z,E.x,E.y,E.z],rt*6),Ue.set([W.r,W.g,W.b,R,W.r,W.g,W.b,R],rt*8)}),Xe.attributes.position.needsUpdate=!0,Xe.attributes.color.needsUpdate=!0}function ve(z=1200){let rt=window.innerWidth,Q=window.innerHeight,E=Math.max(document.body.classList.contains("side-closed")?0:300,c.selected?432:0),R=Math.max(.5,(rt-2*E)/Q),W=Math.tan(_t.fov*Math.PI/360),F=20*Math.PI/180,V=(c.showIsolated?N+M*P:T)+40,ot=Math.max(V/(W*R),V*Math.cos(F)+V*Math.sin(F)/(W*.9))*1.04;return at.cameraPosition({x:0,y:Math.sin(F)*ot,z:Math.cos(F)*ot},{x:0,y:0,z:0},z),ot}let Me=z=>80+z.radius*7,Et=z=>Me(z)/129*1.5;function Oe(z,rt=1300){let Q=new O(_t.position.x-z.x,_t.position.y-z.y,_t.position.z-z.z);Q.lengthSq()<1&&Q.set(0,.3,1),Q.normalize();let E=Me(z),R=window.innerWidth,W=window.innerHeight,F=W/(2*Math.tan(_t.fov*Math.PI/360)),V=464,ot=document.body.classList.contains("side-closed")?0:300,gt=V+Math.max(0,(R-V-ot-530)/2)+90,vt=Math.max(0,R/2-gt)*E/F,bt=new O().crossVectors(new O(0,1,0),Q);bt.lengthSq()<1e-6&&bt.set(1,0,0),bt.normalize().multiplyScalar(vt);let Rt={x:z.x+bt.x,y:z.y+bt.y,z:z.z+bt.z};at.cameraPosition({x:Rt.x+Q.x*E,y:Rt.y+Q.y*E,z:Rt.z+Q.z*E},Rt,rt)}let Ot=new Map,Xt=i.filter(z=>!z.isView).sort((z,rt)=>rt.deg-z.deg).slice(0,26),L=190,A=6,Y=1300,ht=70,st=new O,Mt=z=>.0165+Math.min(.01,z.radius*6e-4);for(let z of k)!z.label||z.count<6||(z.sprite=Uu(z.label,"mod"),z.aspect=lc(z.label,"mod"),ku(z.sprite,.017),z.sprite.position.copy(z.pos),z.sprite.raycast=()=>{},Pt.add(z.sprite));function wt(z,rt){rt.sprite.parent&&rt.sprite.parent.remove(rt.sprite),rt.kind!=="label"&&Rb(rt.sprite),Ot.delete(z)}function nt(z,rt){let Q=z.__threeObj;if(!Q)return;let E;rt==="label"?(E=Uu(z.caseLabel||z.name),ku(E,Mt(z)),E.center.set(.5,0),E.position.set(0,z.radius*1.12+.6,0)):E=Cb(z,p(z)===ai?"#5d5c57":p(z),rt==="cardSel"?30:12,rt==="cardSel",rt==="cardSel"?Et(z):1),Q.add(E),Ot.set(z,{kind:rt,sprite:E})}function it(z){for(let[rt,Q]of[...Ot])(!z||z(Q))&&wt(rt,Q)}let xt=[];function G(){if(xt.forEach(Q=>Pt.remove(Q.sprite)),xt=[],!c.selected||!c.showLabels)return;let rt=r.filter(Q=>Q.kind==="fk"&&m(Q)&&g(Q));if(!(rt.length>60))for(let Q of rt){let E=[...new Set(Q.fks.flatMap(ot=>ot.cols.map(gt=>gt[0])))],R=dr(E.slice(0,2).join(", ")+(E.length>2?` +${E.length-2}`:""),46),W=Uu(R,"fk");ku(W,.0155),W.raycast=()=>{};let F=i[Q.a],V=i[Q.b];W.position.set((F.x+V.x)/2,(F.y+V.y)/2,(F.z+V.z)/2),Pt.add(W),xt.push({sprite:W,aspect:lc(R,"fk")})}}function et(){let z=window.innerWidth,rt=window.innerHeight,Q=rt/(2*Math.tan(_t.fov*Math.PI/360)),E=_t.position,R=c.selected,W=(X,Tt,pt)=>(st.set(X,Tt,pt).project(_t),st.z>1||Math.abs(st.x)>1.08||Math.abs(st.y)>1.08?null:{x:(st.x+1)*z/2,y:(1-st.y)*rt/2,d:Math.hypot(X-E.x,Tt-E.y,pt-E.z)}),F=[];for(let X of l||u)X.__scr=X.__threeObj?W(X.x,X.y,X.z):null,X.__scr&&F.push(X);F.sort((X,Tt)=>X.__scr.d-Tt.__scr.d);let V=new Map,ot=[],gt=X=>{for(let Tt of ot)if(X[0]<Tt[2]&&X[2]>Tt[0]&&X[1]<Tt[3]&&X[3]>Tt[1])return!1;return!0},vt=(X,Tt,pt=1)=>{let Ut=X.__scr,re=Q/Ut.d*Fu*pt,ue=Ut.x+(X.radius+2.5)*Q/Ut.d,ce=Ut.y-ci/2*re;return[ue,ce,ue+Cn*re,ce+(ci+Tt*Bi+8)*re]},bt=(X,Tt,pt,Ut)=>{let re=Tt*Q,ue=re*pt,ce=X.y-Ut;return[X.x-ue/2-2,ce-re,X.x+ue/2+2,ce+1]},Rt=X=>{if(V.has(X)||!X.__scr)return!1;let Tt=bt(X.__scr,Mt(X),X.caseLabel?lc(X.caseLabel):X.__la||(X.__la=lc(X.name)),X.radius*1.12*Q/X.__scr.d);return gt(Tt)?(V.set(X,"label"),ot.push(Tt),!0):!1};if(R&&R.__threeObj&&(c.showCards?(V.set(R,"cardSel"),R.__scr&&ot.push(vt(R,Math.min(R.cols,30),Et(R)))):c.showLabels&&Rt(R),R.__scr)){let X=R.radius*1.9*Q/R.__scr.d;ot.push([R.__scr.x-X,R.__scr.y-X,R.__scr.x+X,R.__scr.y+X])}if(c.showCards){let X=0;for(let Tt of F){if(Tt.__scr.d>L||X>=A)break;if(V.has(Tt))continue;let pt=vt(Tt,Math.min(Tt.cols,12));gt(pt)&&(V.set(Tt,"card"),ot.push(pt),X++)}}if(c.showLabels){for(let X of Xt)_(X)&&(!l||l.has(X))&&Rt(X);for(let X=0;X<h.length&&X<70;X++)Rt(h[X])}for(let X of k){if(!X.sprite)continue;let Tt=c.showLabels&&c.showIsolated&&!l;if(Tt){let pt=W(X.pos.x,X.pos.y,X.pos.z),Ut=pt&&bt(pt,.017,X.aspect,0);Tt=!!Ut&&gt(Ut),Tt&&ot.push(Ut)}X.sprite.visible=Tt}for(let X of xt){let Tt=W(X.sprite.position.x,X.sprite.position.y,X.sprite.position.z),pt=Tt&&bt(Tt,.0155,X.aspect,-.0155*Q*.5),Ut=!!pt&&gt(pt);Ut&&ot.push(pt),X.sprite.visible=Ut}if(c.showLabels){let X=F.filter(pt=>pt.__scr.d<=(pt.ring?230:Y)),Tt=0;for(let pt of[!0,!1])for(let Ut of X){if(Tt>=ht)break;let re=Ot.get(Ut);(!!re&&re.kind==="label")===pt&&Rt(Ut)&&Tt++}}for(let[X,Tt]of[...Ot])(V.get(X)!==Tt.kind||Tt.sprite.parent!==X.__threeObj)&&wt(X,Tt);for(let[X,Tt]of V)Ot.has(X)||nt(X,Tt)}let tt=Pb(),St=0;function mt(z){requestAnimationFrame(mt);let rt=_t.position.distanceTo(Bt.target);Pe.near=rt*.75,Pe.far=rt+3600;let Q=c.selected;Q&&Q.__threeObj?(tt.parent!==Q.__threeObj&&Q.__threeObj.add(tt),tt.scale.setScalar(Q.radius*(3.3+.25*Math.sin(z/380)))):tt.parent&&tt.parent.remove(tt),z-St>200&&(St=z,et())}function yt(){Te(),yn(),at.linkVisibility(K).linkColor(lt).linkWidth(at.linkWidth()).linkDirectionalParticles(at.linkDirectionalParticles()).linkDirectionalArrowLength(at.linkDirectionalArrowLength()).linkDirectionalArrowColor(lt)}function It(){x(),at.nodeVisibility(_),yt(),G()}function $t(z,rt={}){z&&(z.isView&&!c.showViews&&Se("showViews",!0,!0),z.ring&&!c.showIsolated&&Se("showIsolated",!0,!0),Se("autoRotate",!1,!0),c.spot=null),c.selected=z||null,t.onSelect&&t.onSelect(c.selected),It(),oe(),Vi(rt.col),z&&rt.fly!==!1&&Oe(z),et()}function dt(z){if(i.forEach(rt=>{rt.caseLabel=null}),c.caseSet=z?new Set(z.keys()):null,z)for(let[rt,Q]of z)Q&&(rt.caseLabel=`${rt.name}  ${Q}`);it(rt=>rt.kind==="label"),It(),et()}function Nt(z){c.spot=z&&!(c.spot&&c.spot.key===z.key)?z:null,c.selected=null,It(),oe(),Vi(),et()}function Kt(){let z=c.colorMode==="cluster"?n.clusters:n.modules,rt=R=>R.nodes.filter(W=>!W.isView).length,Q=z.slice(0,s).map(R=>({g:R,label:R.label,n:rt(R),color:R.color,mono:!0})),E=z.slice(s);if(E.length){let R={key:"~other",color:ai,nodes:E.flatMap(W=>W.nodes)};Q.push({g:R,label:(c.colorMode==="cluster"?"\u0633\u0627\u06CC\u0631 \u062E\u0648\u0634\u0647\u200C\u0647\u0627":"\u0633\u0627\u06CC\u0631 \u0645\u0627\u0698\u0648\u0644\u200C\u0647\u0627")+` (${Zt(E.length)})`,n:rt(R),color:ai})}if(c.colorMode==="cluster"){let R={key:"~iso",color:ai,nodes:i.filter(W=>!W.isView&&W.deg===0)};Q.push({g:R,label:"\u0628\u062F\u0648\u0646 \u0631\u0627\u0628\u0637\u0647 (\u062D\u0644\u0642\u0647\u0654 \u0628\u06CC\u0631\u0648\u0646\u06CC)",n:R.nodes.length,color:ai})}return{out:Q,rest:E}}let At=[];function oe(){let{out:z,rest:rt}=Kt(),Q=rt.filter(F=>F.nodes.length>=2);At=z.map(F=>F.g).concat(Q);let E=c.spot&&c.spot.key,R=(F,V)=>`<button class="lg${E===F.g.key?" on":""}" data-lg="${V}"><i class="dot" style="background:${F.color}"></i><span class="${F.mono?"mono":""}">${ft(F.label)}</span><b>${Zt(F.n)}</b></button>`,W=z.map(R).join("");Q.length&&(W+=`<details class="more"${Q.some(F=>F.key===E)?" open":""}><summary>\u0641\u0647\u0631\u0633\u062A \u06A9\u0627\u0645\u0644 ${c.colorMode==="cluster"?"\u062E\u0648\u0634\u0647\u200C\u0647\u0627":"\u0645\u0627\u0698\u0648\u0644\u200C\u0647\u0627"}</summary><div class="more-list">`+Q.map((F,V)=>R({g:F,label:F.label,n:F.nodes.filter(ot=>!ot.isView).length,color:F.color,mono:!0},z.length+V)).join("")+"</div></details>"),Dt("#legend").innerHTML=W,Dt("#legend-note").textContent=c.colorMode==="cluster"?"\u062E\u0648\u0634\u0647 \u06CC\u0639\u0646\u06CC \u06AF\u0631\u0648\u0647\u06CC \u0627\u0632 \u062C\u062F\u0648\u0644\u200C\u0647\u0627 \u06A9\u0647 \u0628\u06CC\u0634\u062A\u0631\u06CC\u0646 \u0631\u0627\u0628\u0637\u0647 \u0631\u0627 \u0628\u0627 \u0647\u0645 \u062F\u0627\u0631\u0646\u062F\u061B \u0646\u0627\u0645 \u0647\u0631 \u062E\u0648\u0634\u0647\u060C \u067E\u0631\u0627\u0631\u062A\u0628\u0627\u0637\u200C\u062A\u0631\u06CC\u0646 \u062C\u062F\u0648\u0644 \u0622\u0646 \u0627\u0633\u062A.":"\u0645\u0627\u0698\u0648\u0644 \u0627\u0632 \u067E\u06CC\u0634\u0648\u0646\u062F \u0646\u0627\u0645 \u062C\u062F\u0648\u0644 \u06CC\u0627 \u0646\u0627\u0645 \u0627\u0633\u06A9\u06CC\u0645\u0627 \u06AF\u0631\u0641\u062A\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A (\u0645\u062B\u0644 Sales_ \u060C Hr_ \u060C Tbl_Order\u2026)."}Dt("#legend").addEventListener("click",z=>{let rt=z.target.closest("[data-lg]");rt&&Nt(At[+rt.dataset.lg])});function Se(z,rt,Q){c[z]=rt;let E=document.querySelector(`[data-toggle="${z}"]`);E&&(E.checked=rt),z==="autoRotate"&&(Bt.autoRotate=rt),!Q&&(z==="showIsolated"||z==="showViews"?(c.selected&&!_(c.selected)&&(c.selected=null),It(),Vi()):z==="showFlow"?yt():z==="showLabels"&&G(),et())}document.querySelectorAll("[data-toggle]").forEach(z=>{z.checked=c[z.dataset.toggle],z.addEventListener("change",()=>Se(z.dataset.toggle,z.checked))}),document.querySelectorAll(".seg[data-seg]").forEach(z=>z.addEventListener("click",rt=>{let Q=rt.target.closest("button");if(!Q||Q.classList.contains("on"))return;z.querySelectorAll("button").forEach(R=>R.classList.toggle("on",R===Q));let E=z.dataset.seg;c[E]=Q.dataset.v,E==="colorMode"?(c.spot=null,x(),it(R=>R.kind!=="label"),yt(),oe(),Vi()):E==="sizeMode"&&(i.forEach(R=>{b(R),R.__proxy&&R.__proxy.scale.setScalar(Math.max(3.6,R.radius*1.15))}),it(),at.nodeVal(R=>R.val),yt()),et()})),Dt("#btn-home").addEventListener("click",()=>{c.selected&&$t(null),ve()}),Dt("#btn-side").addEventListener("click",()=>document.body.classList.toggle("side-closed"));function kn(z,rt,Q=""){return`<button class="rel" data-go="${z.id}"><span class="mono rel-t">${ft(z.full)}${Q}</span><span class="mono rel-c">${rt}</span></button>`}let Ss=z=>z.cols.map(([rt,Q])=>`${ft(rt)} \u2192 ${ft(Q)}`).join(" , ");function ws(z){return(z.onDelete===1?'<em class="chip">ON DELETE CASCADE</em>':z.onDelete===2?'<em class="chip">ON DELETE SET NULL</em>':"")+(z.disabled?'<em class="chip warn">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</em>':"")}function Jn(z,rt,Q,E=!0,R=""){return`<details class="sec"${E?" open":""}><summary>${R}${z}<b>${Zt(rt)}</b></summary>${Q}</details>`}function Vi(z){let rt=Dt("#detail"),Q=c.selected;if(document.body.classList.toggle("has-detail",!!Q),!Q){rt.innerHTML="";return}let E=t.detailOverride?t.detailOverride(Q):null;if(E!=null){rt.innerHTML=E,rt.scrollTop=0;return}let R=Q.t,W=Q.cluster,F=Q.module,V=!!t.showCode,ot=new Map;[...Q.out,...Q.self].forEach(X=>X.cols.forEach(([Tt,pt])=>{ot.has(Tt)||ot.set(Tt,{fk:X,r:pt})}));let gt=`<header><div class="d-kind">${Q.isView?"\u0648\u06CC\u0648":"\u062C\u062F\u0648\u0644"}<span class="mono">${ft(Q.schema)}</span></div><h2 class="mono" title="${ft(Q.full)}">${ft(Q.name)}</h2><button class="x" id="d-close" title="\u0628\u0633\u062A\u0646 (Esc)">\u2715</button><div class="d-tags"><button class="tag" data-spot="module" title="\u0646\u0645\u0627\u06CC\u0634 \u0647\u0645\u0647\u0654 \u062C\u062F\u0648\u0644\u200C\u0647\u0627\u06CC \u0627\u06CC\u0646 \u0645\u0627\u0698\u0648\u0644"><i class="dot" style="background:${c.colorMode==="module"?F.color:ai}"></i>\u0645\u0627\u0698\u0648\u0644 <span class="mono">${ft(F.label)}</span></button>`+(W?`<button class="tag" data-spot="cluster" title="\u0646\u0645\u0627\u06CC\u0634 \u0647\u0645\u0647\u0654 \u062C\u062F\u0648\u0644\u200C\u0647\u0627\u06CC \u0627\u06CC\u0646 \u062E\u0648\u0634\u0647"><i class="dot" style="background:${c.colorMode==="cluster"?W.color:ai}"></i>\u062E\u0648\u0634\u0647\u0654 <span class="mono">${ft(W.label)}</span></button>`:"")+"</div>"+(R.d?`<p class="d-desc" dir="auto">${ft(R.d)}</p>`:"")+"</header>";gt+=`<div class="stats"><div><b>${Zt(Q.cols)}</b><span>\u0633\u062A\u0648\u0646</span></div>`+(Q.isView?`<div><b>${Zt(Q.uses.length)}</b><span>\u0645\u0646\u0628\u0639</span></div>`:`<div><b>${Q.rows==null?"\u2014":Zt(Q.rows)}</b><span>\u0631\u062F\u06CC\u0641</span></div><div><b>${Zt(Q.out.length)}</b><span>\u0627\u0631\u062C\u0627\u0639 \u0628\u0647 \u0628\u06CC\u0631\u0648\u0646</span></div><div><b>${Zt(Q.inc.length)}</b><span>\u0627\u0631\u062C\u0627\u0639 \u0628\u0647 \u0627\u06CC\u0646</span></div>`)+"</div>",gt+='<div class="d-actions"><button id="d-fly">\u0646\u0645\u0627\u06CC\u0634 \u062F\u0631 \u0635\u062D\u0646\u0647</button><button id="d-copy">\u06A9\u067E\u06CC \u0646\u0627\u0645</button>'+(t.detailActions?t.detailActions(Q):"")+(Q.isView&&V&&!R.hidden?`<button data-code="${ft(Q.schema+"."+Q.name)}">\u06A9\u062F SQL</button>`:"")+`<span class="seg mini" id="d-hops"><button data-h="1" class="${c.hops===1?"on":""}">\u0647\u0645\u0633\u0627\u06CC\u0647\u0654 \u0645\u0633\u062A\u0642\u06CC\u0645</button><button data-h="2" class="${c.hops===2?"on":""}">\u062A\u0627 \u062F\u0648 \u06AF\u0627\u0645</button></span></div>`;let vt=R.c.map((X,Tt)=>{let pt=X[2],Ut=ot.get(X[0]),re=[];return Ut&&re.push(`<a data-go="${Ut.fk.to}" class="mono">\u2192 ${ft(i[Ut.fk.to].name)}.<wbr>${ft(Ut.r)}</a>`),pt&4&&re.push("identity"),pt&8&&re.push(X[5]?`computed: <span class="mono">${ft(dr(String(X[5]),90))}</span>`:"computed"),X[3]&&re.push(`<span class="mono">= ${ft(X[3])}</span>`),`<tr data-col="${ft(X[0])}"><td class="ci">${Tt+1}</td><td class="ck">${pt&1?'<i class="k pk">PK</i>':""}${pt&16?'<i class="k fk">FK</i>':""}</td><td class="cn"><span class="mono${pt&1?" b":""}">${ft(X[0])}</span>${re.length?`<small>${re.join(" \xB7 ")}</small>`:""}${X[4]?`<small class="cd" dir="auto">${ft(X[4])}</small>`:""}</td><td class="ct mono">${ft(X[1])}${pt&2?"<small>null</small>":""}</td></tr>`}).join("");gt+=Jn("\u0633\u062A\u0648\u0646\u200C\u0647\u0627",R.c.length,`<table class="cols"><tbody>${vt}</tbody></table>`),Q.out.length&&(gt+=Jn("\u0627\u0631\u062C\u0627\u0639 \u0645\u06CC\u200C\u062F\u0647\u062F \u0628\u0647",Q.out.length,Q.out.map(X=>kn(i[X.to],Ss(X),ws(X))).join(""),!0,`<i class="ln" style="background:${D}"></i>`)),Q.inc.length&&(gt+=Jn("\u0627\u0631\u062C\u0627\u0639 \u0634\u062F\u0647 \u0627\u0632",Q.inc.length,Q.inc.map(X=>kn(i[X.from],Ss(X),ws(X))).join(""),Q.inc.length<=60,`<i class="ln" style="background:${j}"></i>`)),Q.self.length&&(gt+=Jn("\u0631\u0627\u0628\u0637\u0647 \u0628\u0627 \u062E\u0648\u062F\u0634",Q.self.length,Q.self.map(X=>`<div class="rel static"><span class="mono rel-c">${Ss(X)}</span></div>`).join(""))),Q.uses.length&&(gt+=Jn("\u0627\u06CC\u0646 \u0648\u06CC\u0648 \u0627\u0632 \u0627\u06CC\u0646\u200C\u0647\u0627 \u0645\u06CC\u200C\u062E\u0648\u0627\u0646\u062F",Q.uses.length,Q.uses.map(X=>kn(i[X],i[X].isView?"view":i[X].cols+" columns")).join(""))),Q.usedBy.length&&(gt+=Jn("\u0648\u06CC\u0648\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0627\u0632 \u0627\u06CC\u0646 \u0645\u06CC\u200C\u062E\u0648\u0627\u0646\u0646\u062F",Q.usedBy.length,Q.usedBy.map(X=>kn(i[X],"view")).join(""),!1)),R.ix&&R.ix.length&&(gt+=Jn("\u0627\u06CC\u0646\u062F\u06A9\u0633\u200C\u0647\u0627",R.ix.length,R.ix.map(X=>`<div class="rel static"><span class="mono rel-t">${ft(X[0])}${X[1]&4?'<em class="chip">PK</em>':X[1]&1?'<em class="chip">UNIQUE</em>':""}${X[1]&2?'<em class="chip">CLUSTERED</em>':""}</span><span class="mono rel-c">${ft(X[2])}${X[3]?` <span class="inc">INCLUDE (${ft(X[3])})</span>`:""}</span></div>`).join(""),!1)),R.ck&&R.ck.length&&(gt+=Jn("\u0642\u06CC\u062F\u0647\u0627\u06CC CHECK",R.ck.length,R.ck.map(X=>`<div class="rel static"><span class="mono rel-t">${ft(X.name)}${X.disabled?'<em class="chip warn">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</em>':""}</span><span class="mono rel-c">${ft(X.definition)}</span></div>`).join(""),!1));let bt=V?"button":"div",Rt=V?"rel":"rel static";if(R.tg&&R.tg.length&&(gt+=Jn("\u062A\u0631\u06CC\u06AF\u0631\u0647\u0627",R.tg.length,R.tg.map(X=>`<${bt} class="${Rt}" data-code="${ft(Q.schema+"."+X.name)}"><span class="mono rel-t">${ft(X.name)}${X.insteadOf?'<em class="chip">INSTEAD OF</em>':""}${X.disabled?'<em class="chip warn">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</em>':""}</span><span class="mono rel-c">${ft((X.events||[]).join(", "))}</span></${bt}>`).join(""),!1)),R.rt&&R.rt.length&&(gt+=Jn("\u067E\u0631\u0648\u0633\u06CC\u062C\u0631\u0647\u0627 \u0648 \u062A\u0627\u0628\u0639\u200C\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0627\u0632 \u0627\u06CC\u0646 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0646\u062F",R.rt.length,R.rt.slice(0,500).map(X=>`<${bt} class="${Rt}" data-code="${ft(X.schema+"."+X.name)}"><span class="mono rel-t">${ft(X.schema==="dbo"?X.name:X.schema+"."+X.name)}</span><span class="mono rel-c">${X.kind==="PROCEDURE"?"procedure":"function"}${X.parameters&&X.parameters.length?" \xB7 "+X.parameters.length+" parameters":""}</span></${bt}>`).join("")+(R.rt.length>500?`<div class="rel static"><span class="rel-c">\u2026 +${R.rt.length-500}</span></div>`:""),!1)),gt+=`<footer>\u0627\u06CC\u062C\u0627\u062F: <span class="mono">${ft(R.cr||"")}</span> \xB7 \u0622\u062E\u0631\u06CC\u0646 \u062A\u063A\u06CC\u06CC\u0631 \u0633\u0627\u062E\u062A\u0627\u0631: <span class="mono">${ft(R.md||"")}</span></footer>`,rt.innerHTML=gt,rt.scrollTop=0,z){let X=rt.querySelector(`tr[data-col="${CSS.escape(z)}"]`);X&&(X.classList.add("hit"),X.scrollIntoView({block:"center"}))}}Dt("#detail").addEventListener("click",z=>{let rt=z.target.closest("[data-go]");if(rt)return $t(i[+rt.dataset.go]);let Q=z.target.closest("[data-code]");if(Q&&t.showCode)return t.showCode(Q.dataset.code);let E=c.selected;if(!E)return;if(z.target.closest("#d-close"))return $t(null);if(z.target.closest("#d-fly"))return Oe(E);let R=z.target.closest("#d-copy");if(R){let V=E.schema+"."+E.name;(navigator.clipboard?navigator.clipboard.writeText(V):Promise.reject()).catch(()=>{let ot=document.createElement("textarea");ot.value=V,document.body.appendChild(ot),ot.select(),document.execCommand("copy"),ot.remove()}).finally(()=>{R.textContent="\u06A9\u067E\u06CC \u0634\u062F",setTimeout(()=>R.textContent="\u06A9\u067E\u06CC \u0646\u0627\u0645",1200)});return}let W=z.target.closest("#d-hops button");if(W){c.hops=+W.dataset.h,It(),Vi(),et();return}let F=z.target.closest("[data-spot]");if(F){let V=F.dataset.spot,ot=V==="cluster"?E.cluster:E.module;c.colorMode!==V&&document.querySelector(`.seg[data-seg="colorMode"] button[data-v="${V}"]`).click(),c.spot=null,Nt(ot)}});let Bn=Dt("#search"),an=Dt("#results"),zn=[],wi=-1,fc=i.map(z=>({n:z,l:z.name.toLowerCase(),d:(z.t.d||"").toLowerCase(),c:z.t.c.map(rt=>rt[0].toLowerCase())}));function mr(){let z=Bn.value.trim().toLowerCase();if(!z){an.classList.remove("open"),zn=[];return}let rt=[],Q=[];for(let F of fc){let V=F.l.indexOf(z);if(V>=0?rt.push([V===0?F.l.length===z.length?0:1:F.l[V-1]==="_"?2:3,F.n]):F.d&&F.d.includes(z)&&rt.push([4,F.n]),z.length>=2)for(let ot=0;ot<F.c.length;ot++){let gt=F.c[ot].indexOf(z);gt>=0&&Q.push([F.c[ot].length===z.length?0:gt===0?1:2,F.n,F.n.t.c[ot]])}}let E=(F,V)=>F[0]-V[0]||V[1].deg-F[1].deg||F[1].name.localeCompare(V[1].name);rt.sort(E),Q.sort(E),zn=[...rt.slice(0,14).map(F=>({n:F[1]})),...Q.slice(0,24).map(F=>({n:F[1],col:F[2]}))];let R=F=>{let V=F.toLowerCase().indexOf(z);return V<0?ft(F):ft(F.slice(0,V))+"<mark>"+ft(F.slice(V,V+z.length))+"</mark>"+ft(F.slice(V+z.length))},W="";rt.length&&(W+=`<div class="r-h">\u062C\u062F\u0648\u0644\u200C\u0647\u0627 \u0648 \u0648\u06CC\u0648\u0647\u0627 <b>${Zt(rt.length)}</b></div>`),zn.forEach((F,V)=>{F.col&&(V===0||!zn[V-1].col)&&(W+=`<div class="r-h">\u0633\u062A\u0648\u0646\u200C\u0647\u0627 <b>${Zt(Q.length)}</b></div>`),W+=F.col?`<button class="r" data-i="${V}"><span class="mono">${R(F.col[0])}</span><small class="mono">${ft(F.n.full)} \xB7 ${ft(F.col[1])}</small></button>`:`<button class="r" data-i="${V}"><i class="dot${F.n.isView?" sq":""}" style="background:${p(F.n)}"></i><span class="mono">${R(F.n.full)}</span><small>${F.n.isView?"\u0648\u06CC\u0648":Zt(F.n.cols)+" \u0633\u062A\u0648\u0646 \xB7 "+Zt(F.n.deg)+" \u0631\u0627\u0628\u0637\u0647"}</small></button>`}),zn.length||(W='<div class="r-h">\u0686\u06CC\u0632\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F</div>'),an.innerHTML=W,an.classList.add("open"),wi=-1}function Do(z){let rt=zn[z];rt&&(an.classList.remove("open"),Bn.blur(),$t(rt.n,{col:rt.col&&rt.col[0]}))}let Es;Bn.addEventListener("input",()=>{clearTimeout(Es),Es=setTimeout(mr,90)}),Bn.addEventListener("focus",()=>{Bn.value.trim()&&mr()}),Bn.addEventListener("keydown",z=>{if(z.key==="ArrowDown"||z.key==="ArrowUp"){if(z.preventDefault(),!zn.length)return;wi=(wi+(z.key==="ArrowDown"?1:-1)+zn.length)%zn.length,an.querySelectorAll(".r").forEach((rt,Q)=>{rt.classList.toggle("cur",Q===wi),Q===wi&&rt.scrollIntoView({block:"nearest"})})}else z.key==="Enter"?(clearTimeout(Es),wi<0&&mr(),Do(Math.max(0,wi))):z.key==="Escape"&&(an.classList.remove("open"),Bn.blur(),z.stopPropagation())}),an.addEventListener("click",z=>{let rt=z.target.closest(".r");rt&&Do(+rt.dataset.i)}),document.addEventListener("pointerdown",z=>{z.target.closest("#searchbox")||an.classList.remove("open")}),document.addEventListener("keydown",z=>{z.target!==Bn&&(z.key==="Escape"?c.selected?$t(null):c.spot&&Nt(null):(z.key==="/"||z.key==="f"&&(z.ctrlKey||z.metaKey))&&(z.preventDefault(),Bn.focus(),Bn.select()))});let Yr=at.renderer().domElement;["pointerdown","wheel"].forEach(z=>Yr.addEventListener(z,()=>{c.autoRotate&&Se("autoRotate",!1,!0)},{passive:!0})),window.addEventListener("resize",()=>at.width(window.innerWidth).height(window.innerHeight));let gr=n.stats;Dt("#dbname").textContent=t.title||n.meta.db,Dt("#stats").innerHTML=[[gr.tables,"\u062C\u062F\u0648\u0644"],[gr.columns,"\u0633\u062A\u0648\u0646"],[gr.fks,"\u0631\u0627\u0628\u0637\u0647"],[gr.views,"\u0648\u06CC\u0648"]].map(([z,rt])=>`<span><b>${Zt(z)}</b>${rt}</span>`).join(""),Dt("#cnt-iso").textContent=Zt(gr.isolated),Dt("#cnt-views").textContent=Zt(gr.views),Dt("#asof").textContent="\u0633\u0627\u062E\u062A\u0627\u0631 \u062E\u0648\u0627\u0646\u062F\u0647\u200C\u0634\u062F\u0647 \u062F\u0631 "+Lo(n.meta.at),Te(),yn(),oe(),document.fonts&&document.fonts.load("600 14px Vazirmatn"),requestAnimationFrame(mt),Dt("#loading").classList.add("hide");let Hi=t.restore;if(Hi&&Hi.cam){at.cameraPosition(Hi.cam.p,Hi.cam.t),Se("autoRotate",!1,!0);let z=Hi.selected&&i.find(rt=>rt.full===Hi.selected);z&&$t(z,{fly:!1})}else{let z=ve(0),rt=20*Math.PI/180;at.cameraPosition({x:0,y:Math.sin(rt)*z*2.4,z:Math.cos(rt)*z*2.4},{x:0,y:0,z:0}),setTimeout(()=>{c.selected||ve(2200)},250)}function dc(z,rt=1400){let Q=new O;z.forEach(F=>Q.add(new O(F.x,F.y,F.z))),Q.multiplyScalar(1/z.length);let E=0;z.forEach(F=>{E=Math.max(E,Math.hypot(F.x-Q.x,F.y-Q.y,F.z-Q.z)+F.radius)});let R=new O().subVectors(_t.position,Q);R.lengthSq()<1&&R.set(0,.3,1),R.normalize();let W=Math.max(170,E*2.8);at.cameraPosition({x:Q.x+R.x*W,y:Q.y+R.y*W,z:Q.z+R.z*W},{x:Q.x,y:Q.y,z:Q.z},rt)}let pc={M:n,nodes:i,state:c,select:$t,setSpot:Nt,setToggle:Se,homeView:ve,lod:Ot,graph:at,setCase:dt,flyTo:Oe,refreshDetail:()=>Vi(),find:z=>i.find(rt=>rt.name.toLowerCase()===String(z).toLowerCase()||rt.full.toLowerCase()===String(z).toLowerCase()),byFull:z=>i.find(rt=>`${rt.schema}.${rt.name}`.toLowerCase()===String(z).toLowerCase()),spotlight:(z,rt)=>{c.spot=null,Se("autoRotate",!1,!0),Nt({key:"~custom",label:rt,color:ai,nodes:z}),z.length&&z.length<=40&&dc(z)},viewState:()=>({cam:{p:{x:_t.position.x,y:_t.position.y,z:_t.position.z},t:{x:Bt.target.x,y:Bt.target.y,z:Bt.target.z}},selected:c.selected?c.selected.full:null}),ready:!0};return window.__db3d=pc,pc}}var AI=60,Bu=60,hc=1e3,uc=1,Db=16;function Nb({api:e,mapId:t}){let n=null,i=null,r=null,s=[],o=!1,a=C=>`${C.schema}.${C.name}`,c=(C,N=90)=>C==null?'<i class="null">NULL</i>':ft(dr(String(C),/^0x[0-9A-F]{30,}/.test(C)?28:N)),l=C=>(C||[]).map(N=>`${N.col} ${N.op==="contains"?"\u220B":N.op==="starts"?"^":N.op==="null"?"IS NULL":"="} ${N.op==="null"?"":N.value}`).join(" , ");async function h(C){let N=i;N.loading=!0,N.error=null,f();try{let T=await e("mapRows",{id:t,table:a(N.node),where:N.where,top:AI,offset:C?N.rows.length:0});if(i!==N)return;N.columns=T.columns,N.rows=C?N.rows.concat(T.rows):T.rows,N.more=T.more}catch(T){if(i!==N)return;N.error=T.message}N.loading=!1,f()}function u(C,N){i={node:C,where:N&&N.length?N:null,columns:[],rows:[],more:!1},h(!1)}function d(){i=null,f()}function f(){let C=Dt("#data");if(C.hidden=!i,document.body.classList.toggle("has-data",!!i),!i)return;let N=i,T=N.node;Dt("#data-title").textContent=T.full,Dt("#data-info").innerHTML=N.loading?"\u062F\u0631 \u062D\u0627\u0644 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0637\u0631\u0647\u0627\u2026":N.error?`<span class="err">\u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0637\u0631\u0647\u0627 \u0645\u0645\u06A9\u0646 \u0646\u0634\u062F: <span dir="auto">${ft(N.error)}</span></span>`:`${Zt(N.rows.length)} \u0633\u0637\u0631${N.more?" (\u0627\u062F\u0627\u0645\u0647 \u062F\u0627\u0631\u062F)":""}${T.rows!=null&&!N.where?" \u0627\u0632 "+Zt(T.rows):""}`+(N.where?` \xB7 \u0641\u06CC\u0644\u062A\u0631: <span class="mono">${ft(l(N.where))}</span>`:"")+(T.t.c.some(H=>H[2]&uc)?" \xB7 \u062C\u062F\u06CC\u062F\u062A\u0631\u06CC\u0646\u200C\u0647\u0627 \u0627\u0648\u0644":"");let I=Dt("#f-col");I.dataset.for!==T.full&&(I.innerHTML=T.t.c.map(H=>`<option>${ft(H[0])}</option>`).join(""),I.dataset.for=T.full,Dt("#f-val").value=""),Dt("#f-clear").hidden=!N.where;let B=new Map(T.t.c.map(H=>[H[0],H[2]])),D=N.columns.slice(0,Bu),j="";D.length?(j='<table class="grid"><thead><tr><th class="rn">#</th>'+D.map(H=>{let Z=B.get(H.name)||0;return`<th>${Z&uc?'<i class="k pk">PK</i>':""}${Z&Db?'<i class="k fk">FK</i>':""}${ft(H.name)}</th>`}).join("")+(N.columns.length>Bu?`<th class="muted">+${N.columns.length-Bu} \u0633\u062A\u0648\u0646 \u062F\u06CC\u06AF\u0631 (\u062F\u0631 \u06A9\u0627\u0631\u062A \u0633\u0637\u0631)</th>`:"")+"</tr></thead><tbody>"+N.rows.map((H,Z)=>`<tr data-i="${Z}"${r&&r.node===T&&r.row===H?' class="on"':""}><td class="rn">${Z+1}</td>`+D.map(($,J)=>`<td>${c(H[J])}</td>`).join("")+(N.columns.length>Bu?"<td></td>":"")+"</tr>").join("")+"</tbody></table>",!N.rows.length&&!N.loading&&(j+='<p class="muted pad">\u0633\u0637\u0631\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0634\u0631\u0637 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.</p>'),N.more&&(j+='<button class="mini more-rows" id="data-more">\u0633\u0637\u0631\u0647\u0627\u06CC \u0628\u0639\u062F\u06CC</button>')):!N.loading&&!N.error&&(j='<p class="muted pad">\u0627\u06CC\u0646 \u062C\u062F\u0648\u0644 \u0633\u0637\u0631\u06CC \u0646\u062F\u0627\u0631\u062F.</p>'),Dt("#data-grid").innerHTML=j}Dt("#data-grid").addEventListener("click",C=>{if(C.target.closest("#data-more"))return h(!0);let N=C.target.closest("tr[data-i]");N&&i&&m(i.node,i.columns.map(T=>T.name),i.rows[+N.dataset.i])}),Dt("#data-close").addEventListener("click",d);let p=()=>{if(!i)return;let C=Dt("#f-op").value,N=Dt("#f-val").value;C!=="null"&&N===""||(i.where=[{col:Dt("#f-col").value,op:C,value:N}],h(!1))};Dt("#f-go").addEventListener("click",p),Dt("#f-val").addEventListener("keydown",C=>{C.key==="Enter"&&p(),C.stopPropagation()}),Dt("#f-clear").addEventListener("click",()=>{i&&(i.where=null,h(!1))});function _(C){let N=C.node.t.c.filter(I=>I[2]&uc).map(I=>I[0]);return(N.length?N:C.cols.slice(0,1)).map(I=>`${I} = ${C.val.get(I.toLowerCase())}`).join(" , ")}function g(C,N){let T=[];for(let I=0;I<C.length&&T.length<3;I++){let B=N[I];typeof B=="string"&&B.trim()&&!/^\d{4}-\d\d-\d\d|^0x/.test(B)&&/char|text/i.test(C[I].type||"char")&&T.push(dr(B.trim(),40))}return T.join(" \xB7 ")}function m(C,N,T,I){r&&!I&&s.push(r);let B=new Map(N.map((D,j)=>[D.toLowerCase(),T[j]]));r={node:C,cols:N,row:T,val:B,structure:!1,parents:[...C.out,...C.self].map(D=>({fk:D,state:"wait"})),children:C.inc.map(D=>({fk:D,count:void 0}))},y(),S(r),w(r)}function y(){o=!0,n.select(r.node),o=!1,b(),i&&f()}function x(){r=null,s=[],n.setCase(null),i&&f()}function b(){if(!r)return;let C=new Map;for(let N of r.parents)N.state==="found"&&C.set(n.nodes[N.fk.to],"");for(let N of r.children){if(!N.count)continue;let T=n.nodes[N.fk.from],I=C.get(T),B=(I&&I.n?I.n:0)+N.count;C.set(T,{n:B})}for(let[N,T]of C)T&&T.n&&C.set(N,`\xD7 ${T.n>hc?hc+"+":T.n}`);n.setCase(C)}async function S(C){for(let N=0;N<C.parents.length;N++){let T=C.parents[N],I=T.fk.cols.map(([B])=>C.val.get(B.toLowerCase()));if(I.some(B=>B==null))T.state="null";else try{let B=await e("mapRows",{id:t,table:a(n.nodes[T.fk.to]),where:T.fk.cols.map(([,D],j)=>({col:D,op:"=",value:I[j]})),top:1});if(r!==C)return;B.rows.length?(T.state="found",T.columns=B.columns,T.row=B.rows[0]):T.state="missing"}catch(B){if(r!==C)return;T.state="error",T.error=B.message}P(`p${N}`,v(T))}b()}async function w(C,N){let T=N!==void 0?[N]:C.children.map((I,B)=>B);for(let I=0;I<T.length;I+=12){let B=T.slice(I,I+12),D=B.map(H=>{let Z=C.children[H];return{table:a(n.nodes[Z.fk.from]),where:Z.fk.cols.map(([$,J])=>({col:$,op:"=",value:C.val.get(J.toLowerCase())}))}}),j=D.map(H=>H.where.every(Z=>Z.value!==null&&Z.value!==void 0));try{let H=await e("mapCounts",{id:t,items:D.filter(($,J)=>j[J]),cap:hc,force:N!==void 0});if(r!==C)return;let Z=0;B.forEach(($,J)=>{C.children[$].count=j[J]?H.counts[Z++]:0})}catch(H){if(r!==C)return;B.forEach(Z=>{C.children[Z].count=null,C.children[Z].error=H.message})}B.forEach(H=>P(`c${H}`,M(C.children[H]))),b()}P("child-sum",U(C))}let v=C=>C.state==="wait"?'<span class="muted">\u2026</span>':C.state==="null"?'<span class="muted">\u0645\u0642\u062F\u0627\u0631 \u0646\u062F\u0627\u0631\u062F (NULL)</span>':C.state==="missing"?'<span class="err">\u0633\u0637\u0631 \u0645\u0631\u062C\u0639 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F</span>':C.state==="error"?`<span class="err" dir="auto">${ft(dr(C.error,90))}</span>`:`<span class="ok">\u2713</span> <span dir="auto">${ft(g(C.columns,C.row))||"\u0633\u0637\u0631 \u0645\u0648\u062C\u0648\u062F \u0627\u0633\u062A"}</span>`,M=C=>C.count===void 0?'<span class="muted">\u2026</span>':C.error?'<span class="err">\u062E\u0637\u0627</span>':C.count===null?'<span class="muted" title="\u062C\u062F\u0648\u0644 \u0628\u0632\u0631\u06AF \u0627\u0633\u062A \u0648 \u0631\u0648\u06CC \u0627\u06CC\u0646 \u0633\u062A\u0648\u0646 \u0627\u06CC\u0646\u062F\u06A9\u0633 \u0646\u062F\u0627\u0631\u062F\u061B \u0628\u0631\u0627\u06CC \u0634\u0645\u0627\u0631\u0634 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F">\u0634\u0645\u0627\u0631\u0634 \u0646\u0634\u062F\u0647</span>':C.count===0?'<span class="muted">\u06F0</span>':`<b class="cnt">${C.count>hc?Zt(hc)+"+":Zt(C.count)}</b> \u0633\u0637\u0631`,U=C=>{let N=C.children.filter(I=>I.count!==void 0),T=N.filter(I=>I.count>0);return N.length<C.children.length?`\u0628\u0631\u0631\u0633\u06CC ${Zt(N.length)} \u0627\u0632 ${Zt(C.children.length)} \u0631\u0627\u0628\u0637\u0647\u2026`:`${Zt(T.length)} \u0631\u0627\u0628\u0637\u0647 \u0633\u0637\u0631 \u062F\u0627\u0631\u062F`};function P(C,N){let T=document.querySelector(`#detail [data-rel="${C}"]`);T&&(T.innerHTML=N)}function k(C){let N=C.node,T=new Map;C.parents.forEach((D,j)=>D.fk.cols.forEach(([H])=>{T.has(H)||T.set(H,j)}));let I=new Map(N.t.c.map(D=>[D[0],D[2]])),B=`<header><div class="d-kind">\u06CC\u06A9 \u0633\u0637\u0631 \u0627\u0632 \u062C\u062F\u0648\u0644<span class="mono">${ft(N.schema)}</span></div><h2 class="mono">${ft(N.name)}</h2><button class="x" id="d-close" title="\u0628\u0633\u062A\u0646 (Esc)">\u2715</button><div class="case-key mono">${ft(dr(_(C),120))}</div></header><div class="d-actions">${s.length?`<button data-case="back">\u2192 \u0633\u0637\u0631 \u0642\u0628\u0644\u06CC (${Zt(s.length)})</button>`:""}<button data-case="rows">\u0633\u0637\u0631\u0647\u0627\u06CC \u0627\u06CC\u0646 \u062C\u062F\u0648\u0644</button><button data-case="structure">\u0633\u0627\u062E\u062A\u0627\u0631 \u062C\u062F\u0648\u0644</button></div>`;if(B+=`<details class="sec" open><summary>\u0645\u0642\u062F\u0627\u0631\u0647\u0627<b>${Zt(C.cols.length)}</b></summary><table class="cols vals"><tbody>`+C.cols.map((D,j)=>{let H=I.get(D)||0,Z=T.get(D),$=C.row[j];return`<tr><td class="ck">${H&uc?'<i class="k pk">PK</i>':""}${H&Db?'<i class="k fk">FK</i>':""}</td><td class="cn"><span class="mono${H&uc?" b":""}">${ft(D)}</span></td><td class="cv" dir="auto">${Z!==void 0&&$!==null?`<a data-case="parent" data-i="${Z}">${c($,200)}</a>`:c($,400)}</td></tr>`}).join("")+"</tbody></table></details>",C.parents.length&&(B+=`<details class="sec" open><summary><i class="ln" style="background:#7fb2f5"></i>\u0627\u06CC\u0646 \u0633\u0637\u0631 \u0628\u0647 \u0627\u06CC\u0646 \u0633\u0637\u0631\u0647\u0627 \u0627\u0634\u0627\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u062F<b>${Zt(C.parents.length)}</b></summary>`+C.parents.map((D,j)=>`<button class="rel" data-case="parent" data-i="${j}"><span class="mono rel-t">${ft(n.nodes[D.fk.to].full)}</span><span class="mono rel-c">${D.fk.cols.map(([H,Z])=>`${ft(H)} = ${c(C.val.get(H.toLowerCase()),40)} \u2192 ${ft(Z)}`).join(" , ")}</span><span class="rel-s" data-rel="p${j}">${v(D)}</span></button>`).join("")+"</details>"),C.children.length){let D=C.children.map((j,H)=>H).sort((j,H)=>(C.children[H].count||0)-(C.children[j].count||0));B+=`<details class="sec" open><summary><i class="ln" style="background:#f2a65a"></i>\u0633\u0637\u0631\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0628\u0647 \u0627\u06CC\u0646 \u0633\u0637\u0631 \u0627\u0634\u0627\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0646\u062F<b data-rel="child-sum">${U(C)}</b></summary>`+D.map(j=>{let H=C.children[j];return`<button class="rel" data-case="child" data-i="${j}"><span class="mono rel-t">${ft(n.nodes[H.fk.from].full)}</span><span class="mono rel-c">${H.fk.cols.map(([Z])=>ft(Z)).join(" , ")}</span><span class="rel-s" data-rel="c${j}">${M(H)}</span></button>`}).join("")+"</details>"}return!C.parents.length&&!C.children.length&&(B+='<p class="muted pad">\u0627\u06CC\u0646 \u062C\u062F\u0648\u0644 \u0628\u0627 \u06A9\u0644\u06CC\u062F \u062E\u0627\u0631\u062C\u06CC \u0628\u0647 \u062C\u062F\u0648\u0644 \u062F\u06CC\u06AF\u0631\u06CC \u0648\u0635\u0644 \u0646\u06CC\u0633\u062A\u061B \u0633\u0637\u0631 \u0645\u0631\u062A\u0628\u0637\u06CC \u0628\u0631\u0627\u06CC \u0646\u0645\u0627\u06CC\u0634 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.</p>'),B}return Dt("#detail").addEventListener("click",C=>{let N=C.target.closest("[data-case]");if(!N)return;C.stopPropagation();let T=N.dataset.case,I=n.state.selected;if(T==="open")return u(I);if(T==="resume"&&r)return r.structure=!1,n.refreshDetail();if(!r)return;if(T==="structure")return r.structure=!0,n.refreshDetail();if(T==="rows")return u(r.node);if(T==="back")return r=s.pop(),y();let B=+N.dataset.i;if(T==="parent"){let D=r.parents[B];D.state==="found"&&m(n.nodes[D.fk.to],D.columns.map(j=>j.name),D.row)}else if(T==="child"){let D=r.children[B];if(D.count===null&&!D.error)return D.count=void 0,P(`c${B}`,M(D)),w(r,B);u(n.nodes[D.fk.from],D.fk.cols.map(([j,H])=>({col:j,op:"=",value:r.val.get(H.toLowerCase())})))}},!0),{attach(C){n=C},openTable:u,detailOverride:C=>r&&r.node===C&&!r.structure?k(r):null,detailActions:C=>`<button data-case="open">\u0633\u0637\u0631\u0647\u0627 (\u062F\u0627\u062F\u0647)</button>${r&&r.node===C?'<button data-case="resume">\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0633\u0637\u0631</button>':""}`,onSelect:C=>{!o&&r&&C!==r.node&&x()}}}var CI=e=>new Promise(t=>setTimeout(t,e));async function Si(e,t){let n;try{n=await fetch("/api/"+e,{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})})}catch{throw new Error("\u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0628\u0631\u0646\u0627\u0645\u0647 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u06CC\u0633\u062A (start.bat \u0628\u0633\u062A\u0647 \u0634\u062F\u0647\u061F)")}let i=await n.json().catch(()=>({error:`\u067E\u0627\u0633\u062E \u0646\u0627\u0645\u0639\u062A\u0628\u0631 (${n.status})`}));if(!n.ok||i.error)throw new Error(i.error||n.statusText);return i}var _n=null,kt=null,pr=[],Ub=5,kb=null,Ob=new URLSearchParams(location.search),Gi=Dt("#dlg");function sm(e,t,n){return Dt("#dlg-title").textContent=e,Dt("#dlg-body").innerHTML=t,Gi.classList.toggle("wide",!!n),Gi.open||Gi.showModal(),Dt("#dlg-body")}Dt("#dlg-close").addEventListener("click",()=>Gi.close());Gi.addEventListener("click",e=>{e.target===Gi&&Gi.close()});var Fb;function Gu(e,t=6e3){let n=Dt("#toast");n.innerHTML=e,n.classList.add("show"),clearTimeout(Fb),t&&(Fb=setTimeout(()=>n.classList.remove("show"),t))}Dt("#toast").addEventListener("click",e=>{let t=e.target.closest("[data-act]");t&&(Dt("#toast").classList.remove("show"),t.dataset.act==="changes"&&Hb(),t.dataset.act==="new"&&Vb(0))});function zu(e,t=""){Dt("#loading").classList.remove("hide"),Dt("#loading-text").innerHTML=e,Dt("#loading-actions").innerHTML=t}var Bb=()=>pr.filter(e=>!kt||e.id!==kt.id).map(e=>`<button data-db="${ft(e.id)}">${ft(e.title)}</button>`).join("")+'<button data-add="1">+ \u0627\u0641\u0632\u0648\u062F\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633</button>';Dt("#loading-actions").addEventListener("click",e=>{let t=e.target.closest("button");t&&(t.dataset.db?om(t.dataset.db):t.dataset.add?$b():t.dataset.retry&&Si("mapRefresh",{id:kt.id}).then(()=>location.reload(),()=>location.reload()))});var om=e=>{location.search="?db="+encodeURIComponent(e)},nm={"table+":"\u062C\u062F\u0648\u0644 \u062C\u062F\u06CC\u062F","table-":"\u062C\u062F\u0648\u0644 \u062D\u0630\u0641\u200C\u0634\u062F\u0647","column+":"\u0633\u062A\u0648\u0646 \u062C\u062F\u06CC\u062F","column-":"\u0633\u062A\u0648\u0646 \u062D\u0630\u0641\u200C\u0634\u062F\u0647","column~":"\u0633\u062A\u0648\u0646 \u062A\u063A\u06CC\u06CC\u0631\u06A9\u0631\u062F\u0647","fk+":"\u0631\u0627\u0628\u0637\u0647\u0654 \u062C\u062F\u06CC\u062F","fk-":"\u0631\u0627\u0628\u0637\u0647\u0654 \u062D\u0630\u0641\u200C\u0634\u062F\u0647","view+":"\u0648\u06CC\u0648 \u062C\u062F\u06CC\u062F","view-":"\u0648\u06CC\u0648 \u062D\u0630\u0641\u200C\u0634\u062F\u0647","view~":"\u0648\u06CC\u0648 \u062A\u063A\u06CC\u06CC\u0631\u06A9\u0631\u062F\u0647","routine+":"\u067E\u0631\u0648\u0633\u06CC\u062C\u0631/\u062A\u0627\u0628\u0639 \u062C\u062F\u06CC\u062F","routine-":"\u067E\u0631\u0648\u0633\u06CC\u062C\u0631/\u062A\u0627\u0628\u0639 \u062D\u0630\u0641\u200C\u0634\u062F\u0647","routine~":"\u067E\u0631\u0648\u0633\u06CC\u062C\u0631/\u062A\u0627\u0628\u0639 \u062A\u063A\u06CC\u06CC\u0631\u06A9\u0631\u062F\u0647"},zb=e=>Object.keys(nm).filter(t=>e&&e[t]).map(t=>`${Zt(e[t])} ${nm[t]}`).join("\u060C "),zi=null;async function Gb(){try{zi=await Si("mapChanges",{id:kt.id})}catch{zi={entries:[]}}return Array.isArray(zi.entries)||(zi.entries=[]),zi}function RI(e){return[...new Set(e.items.filter(n=>/^(table\+|column|fk|view[+~])/.test(n.t)).map(n=>n.n))].map(n=>_n.byFull(n)).filter(Boolean)}function Vb(e){let t=zi&&zi.entries[e];if(!t||!_n)return;let n=t.items.filter(r=>r.t==="table+"||r.t==="view+").map(r=>_n.byFull(r.n)).filter(Boolean),i=n.length?n:RI(t);i.some(r=>r.isView)&&_n.setToggle("showViews",!0),i.length&&_n.spotlight(i,"\u062A\u063A\u06CC\u06CC\u0631\u0627\u062A"),i.length===1&&_n.select(i[0])}async function Hb(){await Gb();let e=zi.entries.filter(i=>!i.first),t="";e.length||(t='<p class="muted">\u0627\u0632 \u0627\u0648\u0644\u06CC\u0646 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631 \u062A\u0627 \u0627\u0644\u0627\u0646 \u062A\u063A\u06CC\u06CC\u0631\u06CC \u062F\u0631 \u0633\u0627\u062E\u062A\u0627\u0631 \u0627\u06CC\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0647\u0631 \u062A\u063A\u06CC\u06CC\u0631 (\u062C\u062F\u0648\u0644\u060C \u0633\u062A\u0648\u0646\u060C \u0631\u0627\u0628\u0637\u0647\u060C \u0648\u06CC\u0648\u060C \u067E\u0631\u0648\u0633\u06CC\u062C\u0631) \u06A9\u0647 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0631\u062E \u062F\u0647\u062F\u060C \u0627\u06CC\u0646\u062C\u0627 \u0641\u0647\u0631\u0633\u062A \u0645\u06CC\u200C\u0634\u0648\u062F.</p>'),zi.entries.slice(0,40).forEach((i,r)=>{if(i.first){t+=`<div class="chg"><div class="chg-h"><b>${Lo(i.at)}</b><span>\u0627\u0648\u0644\u06CC\u0646 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631</span></div></div>`;return}let s=a=>a.endsWith("+")?'<i class="sg add">+</i>':a.endsWith("-")?'<i class="sg del">\u2212</i>':'<i class="sg mod">~</i>',o=i.items.slice(0,250).map(a=>{let c;a.t.startsWith("column")?c=`<span class="mono">${ft(a.n.replace(/^dbo\./,""))}.<b>${ft(a.c)}</b></span><small class="mono">${a.t==="column~"?ft(a.from)+" \u2192 "+ft(a.to):ft(a.type||"")}</small>`:a.t.startsWith("fk")?c=`<span class="mono">${ft(a.n.replace(/^dbo\./,""))} \u2192 ${ft(a.to.replace(/^dbo\./,""))}</span><small class="mono">${ft(a.c||a.fk)}</small>`:c=`<span class="mono"><b>${ft(a.n.replace(/^dbo\./,""))}</b></span>${a.columns?`<small>${Zt(a.columns)} \u0633\u062A\u0648\u0646</small>`:""}`;let l=a.t.startsWith("routine")?`data-code="${ft(a.n)}"`:`data-full="${ft(a.n)}" data-col="${ft(a.c||"")}"`,h=a.t==="table-"||a.t==="view-"||a.t==="routine-";return`<${h?"div":"button"} class="chg-i" ${h?"":l}>${s(a.t)}<em>${nm[a.t]||a.t}</em>${c}</${h?"div":"button"}>`}).join("");t+=`<div class="chg"><div class="chg-h"><b>${Lo(i.at)}</b><span>${zb(i.summary)}</span><button class="mini" data-spot="${r}">\u0646\u0645\u0627\u06CC\u0634 \u062F\u0631 \u0635\u062D\u0646\u0647</button></div>`+o+(i.total>250?`<div class="muted">\u2026 \u0648 ${Zt(i.total-250)} \u0645\u0648\u0631\u062F \u062F\u06CC\u06AF\u0631 (\u0641\u0647\u0631\u0633\u062A \u06A9\u0627\u0645\u0644 \u062F\u0631 \u0641\u0627\u06CC\u0644 <span class="mono">map-data/${ft(kt.id)}.changes.json</span>)</div>`:"")+"</div>"});let n=sm(`\u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u0633\u0627\u062E\u062A\u0627\u0631 \xAB${kt.title}\xBB`,t,!0);n.onclick=i=>{let r=i.target.closest("[data-spot]");if(r)return Gi.close(),Vb(+r.dataset.spot);let s=i.target.closest("[data-code]");if(s)return Wb(s.dataset.code);let o=i.target.closest("[data-full]");if(!o)return;let a=_n.byFull(o.dataset.full);a&&(Gi.close(),_n.select(a,{col:o.dataset.col||void 0}))}}async function Wb(e){let t=sm(e.replace(/^dbo\./,""),'<p class="muted">\u062F\u0631 \u062D\u0627\u0644 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u062A\u0646\u2026</p>',!0);t.onclick=null;try{let{text:n}=await Si("mapCode",{id:kt.id,name:e});if(n==null){t.innerHTML='<p class="muted">\u0645\u062A\u0646 \u0627\u06CC\u0646 \u0634\u06CC\u0621 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A (\u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0627\u062C\u0627\u0632\u0647\u0654 \u062F\u06CC\u062F\u0646 \u0622\u0646 \u0631\u0627 \u0646\u062F\u0627\u0631\u062F).</p>';return}t.innerHTML=`<div class="code-bar"><button class="mini" id="code-copy">\u06A9\u067E\u06CC \u0645\u062A\u0646</button><span class="muted">${Zt(n.split(`
`).length)} \u062E\u0637</span></div><pre class="code" dir="ltr"></pre>`,t.querySelector("pre").textContent=n,t.querySelector("#code-copy").onclick=i=>{navigator.clipboard&&navigator.clipboard.writeText(n),i.target.textContent="\u06A9\u067E\u06CC \u0634\u062F"}}catch(n){t.innerHTML=`<p class="muted">${ft(n.message)}</p>`}}async function $b(){let e=sm("\u0627\u0641\u0632\u0648\u062F\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0628\u0647 \u0646\u0642\u0634\u0647",'<p class="muted">\u062F\u0631 \u062D\u0627\u0644 \u062E\u0648\u0627\u0646\u062F\u0646 \u0627\u062A\u0635\u0627\u0644\u200C\u0647\u0627\u2026</p>');e.onclick=null;let t;try{t=(await Si("mapSources")).connections}catch(i){e.innerHTML=`<p class="err">${ft(i.message)}</p>`;return}if(!t.length){e.innerHTML='<p>\u0647\u0646\u0648\u0632 \u0647\u06CC\u0686 \u0627\u062A\u0635\u0627\u0644 SQL Server \u062F\u0631 Web SQL Studio \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0627\u0628\u062A\u062F\u0627 \u062F\u0631 <a href="/" target="_blank">Web SQL Studio</a> \u0628\u0647 \u0633\u0631\u0648\u0631 \u0648\u0635\u0644 \u0634\u0648\u06CC\u062F (\u0628\u0627 \u0630\u062E\u06CC\u0631\u0647\u0654 \u0631\u0645\u0632)\u060C \u0628\u0639\u062F \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F.</p>';return}e.innerHTML=`
    <p>\u06CC\u06A9\u06CC \u0627\u0632 \u0627\u062A\u0635\u0627\u0644\u200C\u0647\u0627\u06CC Web SQL Studio \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F \u062A\u0627 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u200C\u0647\u0627\u06CC \u0622\u0646 \u0633\u0631\u0648\u0631 \u0641\u0647\u0631\u0633\u062A \u0634\u0648\u062F. \u0641\u0642\u0637 \u0633\u0627\u062E\u062A\u0627\u0631 \u0627\u0632 \u06A9\u0627\u062A\u0627\u0644\u0648\u06AF \u0633\u06CC\u0633\u062A\u0645 \u062E\u0648\u0627\u0646\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F \u0648 \u0686\u06CC\u0632\u06CC \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062A\u063A\u06CC\u06CC\u0631 \u0646\u0645\u06CC\u200C\u06A9\u0646\u062F.</p>
    <label class="fld"><span>\u0627\u062A\u0635\u0627\u0644</span><select id="add-conn">${t.map(i=>`<option value="${ft(i.id)}"${i.ready?"":" disabled"}>${ft(i.name)}${i.ready?"":" \u2014 \u0631\u0645\u0632 \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F\u0647\u061B \u0627\u0628\u062A\u062F\u0627 \u062F\u0631 Studio \u0648\u0635\u0644 \u0634\u0648\u06CC\u062F"}</option>`).join("")}</select></label>
    <div class="btns"><button class="primary" id="add-find">\u06CC\u0627\u0641\u062A\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u200C\u0647\u0627</button><span id="add-msg" class="muted"></span></div>
    <div id="add-list"></div>
    <div class="btns"><button class="primary" id="add-go" disabled>\u0627\u0641\u0632\u0648\u062F\u0646 \u0648 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631</button></div>
    <p class="muted">\u0628\u0631\u0627\u06CC \u0633\u0631\u0648\u0631 \u062C\u062F\u06CC\u062F\u060C \u062F\u0631 <a href="/" target="_blank">Web SQL Studio</a> \u0628\u0647 \u0622\u0646 \u0648\u0635\u0644 \u0634\u0648\u06CC\u062F\u061B \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u0650 \u0647\u0645\u0627\u0646 \u0627\u062A\u0635\u0627\u0644 \u062E\u0648\u062F\u06A9\u0627\u0631 \u0628\u0647 \u0646\u0642\u0634\u0647 \u0627\u0636\u0627\u0641\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.</p>`;let n=i=>e.querySelector(i);n("#add-find").onclick=async()=>{n("#add-msg").textContent="\u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644\u2026",n("#add-list").innerHTML="",n("#add-go").disabled=!0;try{let i=await Si("mapDatabases",{conn:n("#add-conn").value});n("#add-msg").textContent=`\u0633\u0631\u0648\u0631 ${i.server}: ${Zt(i.databases.length)} \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u0650 \u0642\u0627\u0628\u0644\u200C\u062F\u0633\u062A\u0631\u0633`,n("#add-list").innerHTML=i.databases.map(r=>`<label class="chk"><input type="checkbox" value="${ft(r.name)}"${r.added?" disabled":""}><span class="mono">${ft(r.name)}</span>${r.added?"<small>\u0642\u0628\u0644\u0627\u064B \u0627\u0636\u0627\u0641\u0647 \u0634\u062F\u0647</small>":""}</label>`).join(""),n("#add-list").onchange=()=>{n("#add-go").disabled=!n("#add-list").querySelector("input:checked")}}catch(i){n("#add-msg").textContent="\u0627\u062A\u0635\u0627\u0644 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F: "+i.message}},n("#add-go").onclick=async()=>{let i=[...n("#add-list").querySelectorAll("input:checked")].map(r=>r.value);n("#add-go").disabled=!0;try{let r=await Si("mapAdd",{conn:n("#add-conn").value,databases:i});r.added&&r.added.length?om(r.added[0]):Gi.close()}catch(r){n("#add-msg").textContent=r.message,n("#add-go").disabled=!1}}}var im=e=>e.state==="extracting"||e.state==="checking"||e.state==="new";function am(){let e=t=>t.state==="error"?'<i class="st err" title="\u062E\u0637\u0627"></i>':im(t)?'<i class="st busy"></i>':t.state==="offline"?'<i class="st off"></i>':'<i class="st ok"></i>';Dt("#dbmenu").innerHTML=pr.map(t=>`<div class="dbrow${kt&&t.id===kt.id?" cur":""}">
      <button class="dbgo" data-db="${ft(t.id)}">${e(t)}<span class="mono">${ft(t.title)}</span><small>${t.counts?Zt(t.counts.tables)+" \u062C\u062F\u0648\u0644 \xB7 "+Zt(t.counts.foreignKeys)+" \u0631\u0627\u0628\u0637\u0647":t.state==="error"||t.state==="offline"?"\u062E\u0648\u0627\u0646\u062F\u0647 \u0646\u0634\u062F\u0647":"\u062F\u0631 \u062D\u0627\u0644 \u062E\u0648\u0627\u0646\u062F\u0646\u2026"}${t.server?' \xB7 <span class="mono">'+ft(t.server)+"</span>":""}</small></button>
      <button class="dbdel" data-del="${ft(t.id)}" title="\u062D\u0630\u0641 \u0627\u0632 \u0646\u0642\u0634\u0647">\u2715</button></div>`).join("")+'<button id="db-add">+ \u0627\u0641\u0632\u0648\u062F\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u2026</button><a id="db-studio" href="/" target="_blank">\u0628\u0627\u0632\u06A9\u0631\u062F\u0646 Web SQL Studio \u2197</a>'}Dt("#dbbtn").addEventListener("click",e=>{e.stopPropagation(),am(),Dt("#dbmenu").classList.toggle("open")});document.addEventListener("pointerdown",e=>{!e.target.closest("#dbmenu")&&!e.target.closest("#dbbtn")&&Dt("#dbmenu").classList.remove("open")});Dt("#dbmenu").addEventListener("click",async e=>{let t=e.target.closest("[data-db]"),n=e.target.closest("[data-del]");if(e.target.closest("#db-add"))return Dt("#dbmenu").classList.remove("open"),$b();if(t){!kt||t.dataset.db!==kt.id?om(t.dataset.db):Dt("#dbmenu").classList.remove("open");return}if(n){let i=pr.find(r=>r.id===n.dataset.del);if(!i||!confirm(`\xAB${i.title}\xBB \u0627\u0632 \u0646\u0642\u0634\u0647 \u062D\u0630\u0641 \u0634\u0648\u062F\u061F
\u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u0633\u0627\u062E\u062A\u0627\u0631\u0650 \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647\u0654 \u0622\u0646 (JSON) \u0647\u0645 \u067E\u0627\u06A9 \u0645\u06CC\u200C\u0634\u0648\u0646\u062F. \u0628\u0647 \u062E\u0648\u062F\u0650 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062F\u0633\u062A \u0632\u062F\u0647 \u0646\u0645\u06CC\u200C\u0634\u0648\u062F.`))return;await Si("mapRemove",{id:i.id}),kt&&i.id===kt.id?location.href=location.pathname:(await Vu(),am())}});function jb(){if(!kt)return;Dt("#asof").textContent=kt.extractedAt?"\u0622\u062E\u0631\u06CC\u0646 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631: "+Lo(kt.extractedAt):"";let e=Dt("#sync-state");kt.state==="extracting"?e.innerHTML='<i class="st busy"></i>\u062F\u0631 \u062D\u0627\u0644 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631 \u0627\u0632 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u2026':kt.state==="checking"?e.innerHTML='<i class="st busy"></i>\u062F\u0631 \u062D\u0627\u0644 \u0628\u0631\u0631\u0633\u06CC \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A\u2026':kt.state==="offline"?e.innerHTML='<i class="st off"></i>\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u0627\u06CC\u0646 \u0633\u0631\u0648\u0631 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u06CC\u0633\u062A\u061B \u0646\u0645\u0627 \u0627\u0632 \u0633\u0627\u062E\u062A\u0627\u0631 \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647 \u0627\u0633\u062A. \u0628\u0631\u0627\u06CC \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC\u060C \u062F\u0631 Web SQL Studio \u0628\u0647 \u0633\u0631\u0648\u0631 \u0648\u0635\u0644 \u0634\u0648\u06CC\u062F.':kt.state==="error"?e.innerHTML=`<i class="st err"></i>\u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A\u061B \u0646\u0645\u0627 \u0627\u0632 \u0633\u0627\u062E\u062A\u0627\u0631 \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647 \u0627\u0633\u062A. <span class="muted" dir="auto">${ft(kt.error||"")}</span>`:e.innerHTML=`<i class="st ok"></i>\u0628\u0631\u0631\u0633\u06CC \u062E\u0648\u062F\u06A9\u0627\u0631 \u0647\u0631 ${Zt(Ub)} \u062F\u0642\u06CC\u0642\u0647${kt.checkedAt?" \xB7 \u0622\u062E\u0631\u06CC\u0646 \u0628\u0631\u0631\u0633\u06CC "+Ib(kt.checkedAt):""}`}async function Vu(){let e=await Si("mapList");return pr=e.maps,Ub=e.checkEveryMinutes,kt&&(kt=pr.find(t=>t.id===kt.id)||null),pr}var Ms=null;Dt("#btn-check").addEventListener("click",async()=>{if(kt){Ms={before:kt.extractedAt,at:Date.now()},Dt("#sync-state").innerHTML='<i class="st busy"></i>\u062F\u0631 \u062D\u0627\u0644 \u0628\u0631\u0631\u0633\u06CC \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A\u2026';try{await Si("mapRefresh",{id:kt.id})}catch(e){Gu(ft(e.message)),Ms=null}setTimeout(cm,1500)}});Dt("#btn-changes").addEventListener("click",()=>Hb());function PI(){try{sessionStorage.setItem("dbmap.restore",JSON.stringify(Object.assign({db:kt.id,updated:!0},_n?_n.viewState():{})))}catch{}location.reload()}var rm;async function cm(){clearTimeout(rm);try{if(await Vu(),!kt){location.href=location.pathname;return}if(jb(),Dt("#dbmenu").classList.contains("open")&&am(),_n&&kt.changedAt&&kt.changedAt!==kb){Gu("\u0633\u0627\u062E\u062A\u0627\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062A\u063A\u06CC\u06CC\u0631 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A\u061B \u0646\u0645\u0627 \u0628\u0647\u200C\u0631\u0648\u0632 \u0645\u06CC\u200C\u0634\u0648\u062F\u2026",0),setTimeout(PI,900);return}if(Ms&&!im(kt)&&(kt.extractedAt!==Ms.before||kt.state!=="ok"||Date.now()-Ms.at>2e4)){let e=kt.state==="ok";Ms=null,Gu(e?"\u0633\u0627\u062E\u062A\u0627\u0631 \u062F\u0648\u0628\u0627\u0631\u0647 \u062E\u0648\u0627\u0646\u062F\u0647 \u0634\u062F\u061B \u062A\u063A\u06CC\u06CC\u0631\u06CC \u0646\u0633\u0628\u062A \u0628\u0647 \u0642\u0628\u0644 \u0646\u062F\u0627\u0634\u062A.":"\u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u0628\u0648\u062F\u061B \u0646\u0645\u0627 \u0627\u0632 \u0633\u0627\u062E\u062A\u0627\u0631 \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647 \u0627\u0633\u062A.")}}catch(e){Dt("#sync-state").innerHTML=`<i class="st err"></i>${ft(e.message)}`}rm=setTimeout(cm,Ms||kt&&im(kt)?2500:1e4)}II().catch(e=>{console.error(e),zu(`<span class="err">${ft(e&&e.message?e.message:String(e))}</span>`,(kt?'<button data-retry="1">\u062A\u0644\u0627\u0634 \u062F\u0648\u0628\u0627\u0631\u0647</button>':"")+Bb())});async function II(){if(await Vu(),!pr.length){zu("\u0647\u0646\u0648\u0632 \u0647\u06CC\u0686 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633\u06CC \u062F\u0631 \u0646\u0642\u0634\u0647 \u0646\u06CC\u0633\u062A. \u062F\u0631 Web SQL Studio \u0628\u0647 \u06CC\u06A9 SQL Server \u0648\u0635\u0644 \u0634\u0648\u06CC\u062F\u060C \u06CC\u0627 \u0627\u0632 \u0627\u062A\u0635\u0627\u0644\u200C\u0647\u0627\u06CC \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647 \u06CC\u06A9\u06CC \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F.",'<button data-add="1">+ \u0627\u0641\u0632\u0648\u062F\u0646 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633</button>');return}let e=Ob.get("db");if(!e)try{e=localStorage.getItem("dbmap.last")}catch{}for(kt=pr.find(s=>s.id===e)||pr[0];!kt.extractedAt;){if(kt.state==="error"||kt.state==="offline")throw new Error(`\u0633\u0627\u062E\u062A\u0627\u0631 \xAB${kt.title}\xBB \u0647\u0646\u0648\u0632 \u062E\u0648\u0627\u0646\u062F\u0647 \u0646\u0634\u062F\u0647 \u0648 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A: ${kt.error||""}`);if(zu(`\u062F\u0631 \u062D\u0627\u0644 \u062E\u0648\u0627\u0646\u062F\u0646 \u0633\u0627\u062E\u062A\u0627\u0631 \xAB${ft(kt.title)}\xBB \u0627\u0632 \u0633\u0631\u0648\u0631\u2026 (\u0627\u0648\u0644\u06CC\u0646 \u0628\u0627\u0631 \u0686\u0646\u062F \u062B\u0627\u0646\u06CC\u0647 \u0637\u0648\u0644 \u0645\u06CC\u200C\u06A9\u0634\u062F)`,Bb()),await CI(1500),await Vu(),!kt){location.href=location.pathname;return}}try{localStorage.setItem("dbmap.last",kt.id)}catch{}zu("\u062F\u0631 \u062D\u0627\u0644 \u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0627\u062E\u062A\u0627\u0631\u2026");let t=await Si("mapStructure",{id:kt.id});kb=kt.changedAt;let n=null;try{n=JSON.parse(sessionStorage.getItem("dbmap.restore")||"null"),sessionStorage.removeItem("dbmap.restore")}catch{}n&&n.db!==kt.id&&(n=null),document.title=`${kt.title} \u2014 \u0646\u0642\u0634\u0647\u0654 \u067E\u0627\u06CC\u06AF\u0627\u0647\u200C\u062F\u0627\u062F\u0647`;let i=Nb({api:Si,mapId:kt.id});_n=await Lb(_b(t),{title:kt.title,cacheId:kt.id,restore:n,showCode:Wb,detailOverride:i.detailOverride,detailActions:i.detailActions,onSelect:i.onSelect}),i.attach(_n),document.body.classList.add("server-mode"),jb(),rm=setTimeout(cm,4e3);let r=Ob.get("table");if(r&&!n){let s=_n.byFull(r)||_n.find(r);s&&setTimeout(()=>_n.select(s),600)}if(n&&n.updated){await Gb();let s=zi.entries[0];if(s&&!s.first){let o=s.items.some(a=>a.t==="table+"||a.t==="view+");Gu(`\u0633\u0627\u062E\u062A\u0627\u0631 \xAB${ft(kt.title)}\xBB \u0628\u0647\u200C\u0631\u0648\u0632 \u0634\u062F: ${zb(s.summary)}<span class="t-btns">${o?'<button data-act="new">\u0646\u0645\u0627\u06CC\u0634 \u062C\u062F\u0648\u0644\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F</button>':""}<button data-act="changes">\u062C\u0632\u0626\u06CC\u0627\u062A</button></span>`,15e3)}}}})();
