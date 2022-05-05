const socket = io();
class Scene extends EventEmitter {
  constructor(
    domElement = document.getElementById("gl_context"),
    _width = window.innerWidth,
    _height = window.innerHeight,
    hasControls = true,
    clearColor = "black"
  ) {
    //Since we extend EventEmitter we need to instance it from here
    super();

    //THREE scene
    this.scene = new THREE.Scene();

    //Utility
    this.width = _width;
    this.height = _height;

    //THREE Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      1000
    );

    //THREE WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
    });

    this.renderer.setClearColor(new THREE.Color(clearColor));

    this.renderer.setSize(this.width, this.height);

    //Push the canvas to the DOM
    domElement.append(this.renderer.domElement);

    if (hasControls) {
      this.controls = new THREE.FirstPersonControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.lookSpeed = 0.05;
    }

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);
    domElement.addEventListener(
      "mouseenter",
      (e) => this.onEnterCanvas(e),
      false
    );
    domElement.addEventListener(
      "mouseleave",
      (e) => this.onLeaveCanvas(e),
      false
    );
    window.addEventListener("keydown", (e) => this.onKeyDown(e), false);

    this.helperGrid = new THREE.GridHelper(10, 10);
    this.helperGrid.position.y = -0.5;
    this.scene.add(this.helperGrid);
    this.clock = new THREE.Clock();

    this.update();
  }

  drawUsers(positions, id) {
    for (let i = 0; i < Object.keys(positions).length; i++) {
      if (Object.keys(positions)[i] != id) {
        this.users[i].position.set(
          positions[Object.keys(positions)[i]].position[0],
          positions[Object.keys(positions)[i]].position[1],
          positions[Object.keys(positions)[i]].position[2]
        );
      }
    }
  }

  update() {
    requestAnimationFrame(() => this.update());
    this.controls.update(this.clock.getDelta());
    this.controls.target = new THREE.Vector3(0, 0, 0);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = Math.floor(window.innerHeight - window.innerHeight * 0.3);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onLeaveCanvas(e) {
    this.controls.enabled = false;
  }
  onEnterCanvas(e) {
    this.controls.enabled = true;
  }
  onKeyDown(e) {
    this.emit("userMoved");
  }
}
let glScene = new Scene();
let id;
let instances = [];
let clients = new Object();

glScene.on("userMoved", () => {
  socket.emit("move", [
    glScene.camera.position.x,
    glScene.camera.position.y,
    glScene.camera.position.z,
  ]);
});

//On connection server sends the client his ID
socket.on("introduction", (_id, _clientNum, _ids) => {
  for (let i = 0; i < _ids.length; i++) {
    if (_ids[i] != _id) {
      clients[_ids[i]] = {
        mesh: new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        ),
      };

      //Add initial users to the scene
      glScene.scene.add(clients[_ids[i]].mesh);
    }
  }

  console.log(clients);

  id = _id;
  console.log("Mi ID es: " + id);
});

socket.on("newUserConnected", (clientCount, _id, _ids) => {
  console.log(clientCount + " usuarios conectados");
  let alreadyHasUser = false;
  for (let i = 0; i < Object.keys(clients).length; i++) {
    if (Object.keys(clients)[i] == _id) {
      alreadyHasUser = true;
      break;
    }
  }
  if (_id != id && !alreadyHasUser) {
    console.log("Llego alguien al server!!! con el id: " + _id);
    clients[_id] = {
      mesh: new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshNormalMaterial()
      ),
    };

    //Add initial users to the scene
    glScene.scene.add(clients[_id].mesh);
  }
});

socket.on("userDisconnected", (clientCount, _id, _ids) => {
  //Update the data from the server
  document.getElementById("numUsers").textContent = clientCount;

  if (_id != id) {
    console.log("Y se marcho!!, el usuario con id: " + _id);
    glScene.scene.remove(clients[_id].mesh);
    delete clients[_id];
  }
});

socket.on("connect", () => {});

//Update when one of the users moves in space
socket.on("userPositions", (_clientProps) => {
  // console.log('Positions of all users are ', _clientProps, id);
  // console.log(Object.keys(_clientProps)[0] == id);
  for (let i = 0; i < Object.keys(_clientProps).length; i++) {
    if (Object.keys(_clientProps)[i] != id) {
      //Store the values
      let oldPos = clients[Object.keys(_clientProps)[i]].mesh.position;
      let newPos = _clientProps[Object.keys(_clientProps)[i]].position;

      //Create a vector 3 and lerp the new values with the old values
      let lerpedPos = new THREE.Vector3();
      lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3);
      lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3);
      lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3);

      //Set the position
      clients[Object.keys(_clientProps)[i]].mesh.position.set(
        lerpedPos.x,
        lerpedPos.y,
        lerpedPos.z
      );
    }
  }
});
