import * as THREE from 'three'
import VirtualScroll from 'virtual-scroll'
import { gl } from './core/WebGL'
import fragmentShader from './shader/fs.glsl'
import vertexShader from './shader/vs.glsl'
import { Assets, loadAssets } from './utils/assetLoader'
import { calcCoveredTextureScale } from './utils/coveredTexture'

type CardMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>

export class TCanvas {
  private assets: Assets = {
    image1: { path: 'images/unsplash_1.jpg' },
    image2: { path: 'images/unsplash_2.jpg' },
    image3: { path: 'images/unsplash_3.jpg' },
    image4: { path: 'images/unsplash_4.jpg' },
    image5: { path: 'images/unsplash_5.jpg' },
    image6: { path: 'images/unsplash_6.jpg' },
    image7: { path: 'images/unsplash_7.jpg' },
    image8: { path: 'images/unsplash_8.jpg' },
  }

  private cards = new THREE.Group()
  private frustum = new THREE.Frustum()
  private centerTarget = new THREE.Vector3()
  private edgeTarget = new THREE.Vector3()

  constructor(private container: HTMLElement) {
    loadAssets(this.assets).then(() => {
      this.init()
      this.createObjects()
      this.addEvents()
      gl.requestAnimationFrame(this.anime)
    })
  }

  private init() {
    gl.setup(this.container)
    gl.scene.background = new THREE.Color('#000')
    gl.camera.position.z = 5.3

    gl.setResizeCallback(this.resize)
    // gl.scene.add(new THREE.AxesHelper())
  }

  private addEvents() {
    const scroller = new VirtualScroll()
    scroller.on((event) => {
      this.cards.userData.target.position.y -= event.deltaY * 0.002 * 0.2
      this.cards.userData.target.rotation.y -= event.deltaY * 0.0084 * 0.2
    })
  }

  private createObjects() {
    const amount = 40
    const spiralGap = 0.5
    const radius = 2.5

    const textures = Object.values(this.assets).map((v) => ({
      texture: v.data as THREE.Texture,
      uvScale: calcCoveredTextureScale(v.data as THREE.Texture, gl.size.aspect),
    }))

    const geometry = new THREE.PlaneGeometry(1.3, 1, 30, 30)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uRadius: { value: radius },
        tImage: { value: null },
        uUvScale: { value: new THREE.Vector2() },
        uSpeed: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      // wireframe: true,
    })
    const offset = ((geometry.parameters.height + spiralGap) * ~~(amount / 10)) / 2

    const mat4 = new THREE.Matrix4()
    const pos = new THREE.Vector3()

    for (let i = 0; i < amount; i++) {
      const mat = material.clone()

      const textureData = textures[i % textures.length]
      mat.uniforms.tImage.value = textureData.texture
      mat.uniforms.uUvScale.value.set(textureData.uvScale[0], textureData.uvScale[1])

      const mesh = new THREE.Mesh(geometry, mat)
      const roundAngle = i / 10

      mesh.applyMatrix4(mat4.makeRotationY(Math.PI * 2 * roundAngle))

      const x = radius * Math.sin(Math.PI * 2 * roundAngle)
      const y = (geometry.parameters.height + spiralGap) * roundAngle - offset
      const z = radius * Math.cos(Math.PI * 2 * roundAngle)
      pos.set(x, y, z)

      const fromCenterVec = new THREE.Vector3(0, y, 0).sub(pos).normalize()
      mesh.applyMatrix4(mat4.makeRotationAxis(fromCenterVec, -Math.PI / 33.5))

      mesh.position.copy(pos)

      this.cards.add(mesh)
    }

    this.cards.userData = {
      target: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    }

    gl.scene.add(this.cards)
  }

  private resize = () => {
    this.cards.children.forEach((child) => {
      const card = child as CardMesh
      calcCoveredTextureScale(card.material.uniforms.tImage.value, gl.size.aspect, card.material.uniforms.uUvScale.value)
    })
  }

  private updateCardPosition() {
    gl.camera.updateMatrix()
    gl.camera.updateMatrixWorld()
    const matrix = new THREE.Matrix4().multiplyMatrices(gl.camera.projectionMatrix, gl.camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(matrix)

    const card = this.cards.children[0] as CardMesh
    const height = (card.geometry.parameters.height + 0.5) * 4

    for (let i = 0; i < this.cards.children.length; i++) {
      const card = this.cards.children[i] as CardMesh
      card.getWorldPosition(this.centerTarget)

      this.edgeTarget.copy(this.centerTarget).setX(0)

      if (0 < this.centerTarget.y) {
        this.edgeTarget.y -= card.geometry.parameters.height / 2 + 0.15
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.y -= height
        }
      } else if (this.centerTarget.y < 0) {
        this.edgeTarget.y += card.geometry.parameters.height / 2 + 0.15
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.y += height
        }
      }
    }
  }

  // ----------------------------------
  // animation
  private anime = () => {
    this.updateCardPosition()

    this.cards.position.y = THREE.MathUtils.lerp(this.cards.position.y, this.cards.userData.target.position.y, 0.07)
    this.cards.rotation.y = THREE.MathUtils.lerp(this.cards.rotation.y, this.cards.userData.target.rotation.y, 0.07)

    const speed = this.cards.userData.target.rotation.y - this.cards.rotation.y
    this.cards.children.forEach((card) => {
      ;(card as CardMesh).material.uniforms.uSpeed.value = speed
    })

    gl.render()
  }

  // ----------------------------------
  // dispose
  dispose() {
    gl.dispose()
  }
}
