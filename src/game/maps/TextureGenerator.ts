import * as THREE from 'three'

export class TextureGenerator {
  // 1. Sandstone Pavement Ground Texture
  public static createSandstonePavement(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Base warm desert sand
    ctx.fillStyle = '#c8a265'
    ctx.fillRect(0, 0, 512, 512)

    // Sandstone paving grid
    const tileSize = 64
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Tile variation
        const shade = Math.floor(Math.random() * 25) - 12
        const r = Math.min(255, Math.max(0, 200 + shade))
        const g = Math.min(255, Math.max(0, 162 + shade))
        const b = Math.min(255, Math.max(0, 101 + shade))

        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)

        // Mortar shadow lines
        ctx.strokeStyle = '#8c6d3d'
        ctx.lineWidth = 2
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2)
      }
    }

    // Sand grain noise
    const imgData = ctx.getImageData(0, 0, 512, 512)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16
      data[i] = Math.min(255, Math.max(0, data[i] + noise))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
    }
    ctx.putImageData(imgData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(16, 16)
    return texture
  }

  // 2. Weathered Sandstone Wall Brick Texture
  public static createSandstoneWall(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#b58f55'
    ctx.fillRect(0, 0, 512, 512)

    // Brick rows
    const brickH = 40
    const brickW = 80
    let row = 0
    for (let y = 0; y < 512; y += brickH) {
      const offset = (row % 2) * (brickW / 2)
      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        const tone = Math.floor(Math.random() * 30) - 15
        ctx.fillStyle = `rgb(${181 + tone}, ${143 + tone}, ${85 + tone})`
        ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4)

        ctx.strokeStyle = '#7c5f35'
        ctx.lineWidth = 2
        ctx.strokeRect(x + offset + 1, y + 1, brickW - 2, brickH - 2)
      }
      row++
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 2)
    return texture
  }

  // 3. Tactical Military Wooden Crate Texture
  public static createTacticalCrate(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Wood base
    ctx.fillStyle = '#78532d'
    ctx.fillRect(0, 0, 512, 512)

    // Wood planks
    const plankH = 512 / 6
    for (let i = 0; i < 6; i++) {
      const shade = Math.floor(Math.random() * 20) - 10
      ctx.fillStyle = `rgb(${120 + shade}, ${83 + shade}, ${45 + shade})`
      ctx.fillRect(0, i * plankH + 2, 512, plankH - 4)

      ctx.strokeStyle = '#4a3319'
      ctx.lineWidth = 3
      ctx.strokeRect(0, i * plankH, 512, plankH)
    }

    // Outer framing border
    ctx.fillStyle = '#5c3e1e'
    ctx.fillRect(0, 0, 512, 36)
    ctx.fillRect(0, 512 - 36, 512, 36)
    ctx.fillRect(0, 0, 36, 512)
    ctx.fillRect(512 - 36, 0, 512, 512)

    // Diagonal Cross Brace
    ctx.strokeStyle = '#5c3e1e'
    ctx.lineWidth = 42
    ctx.beginPath()
    ctx.moveTo(36, 36)
    ctx.lineTo(512 - 36, 512 - 36)
    ctx.stroke()

    // Metal Corner Brackets & Rivets
    ctx.fillStyle = '#2a2d34'
    const bracketSize = 72
    // Top-left, Top-right, Bottom-left, Bottom-right brackets
    ctx.fillRect(0, 0, bracketSize, 28)
    ctx.fillRect(0, 0, 28, bracketSize)

    ctx.fillRect(512 - bracketSize, 0, bracketSize, 28)
    ctx.fillRect(512 - 28, 0, 28, bracketSize)

    ctx.fillRect(0, 512 - 28, bracketSize, 28)
    ctx.fillRect(0, 512 - bracketSize, 28, bracketSize)

    ctx.fillRect(512 - bracketSize, 512 - 28, bracketSize, 28)
    ctx.fillRect(512 - 28, 512 - bracketSize, 28, bracketSize)

    // Stenciled Military Markings
    ctx.font = 'bold 28px Rajdhani, monospace'
    ctx.fillStyle = 'rgba(235, 235, 235, 0.75)'
    ctx.textAlign = 'center'
    ctx.fillText('TACTICAL ARMS', 256, 180)
    ctx.font = 'bold 20px Rajdhani, monospace'
    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'
    ctx.fillText('FRAGILE // EXPLOSIVE', 256, 340)

    return new THREE.CanvasTexture(canvas)
  }

  // 4. Corrugated Steel Shipping Container Texture
  public static createContainerTexture(baseColorHex: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = baseColorHex
    ctx.fillRect(0, 0, 512, 512)

    // Vertical corrugated ridges
    const stripeW = 16
    for (let x = 0; x < 512; x += stripeW * 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.fillRect(x, 0, stripeW, 512)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.fillRect(x + stripeW, 0, stripeW, 512)
    }

    // Yellow/Black Hazard Stripes on Bottom
    const hazardH = 32
    for (let x = -50; x < 550; x += 40) {
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(x, 512)
      ctx.lineTo(x + 24, 512)
      ctx.lineTo(x + 44, 512 - hazardH)
      ctx.lineTo(x + 20, 512 - hazardH)
      ctx.fill()
    }

    // Container Serial Number
    ctx.font = 'bold 24px Rajdhani, monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.textAlign = 'left'
    ctx.fillText('MSKU 892-411 [T-7]', 32, 60)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }

  // 5. Polished Industrial Warehouse Concrete
  public static createWarehouseFloor(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Concrete dark slate base
    ctx.fillStyle = '#22262f'
    ctx.fillRect(0, 0, 512, 512)

    // Concrete Slab Grid
    const slab = 256
    ctx.strokeStyle = '#12151b'
    ctx.lineWidth = 4
    ctx.strokeRect(0, 0, slab, slab)
    ctx.strokeRect(slab, 0, slab, slab)
    ctx.strokeRect(0, slab, slab, slab)
    ctx.strokeRect(slab, slab, slab, slab)

    // Yellow Safety Walking Lane Lines
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 8
    ctx.setLineDash([24, 16])
    ctx.beginPath()
    ctx.moveTo(128, 0)
    ctx.lineTo(128, 512)
    ctx.moveTo(384, 0)
    ctx.lineTo(384, 512)
    ctx.stroke()
    ctx.setLineDash([])

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(10, 12)
    return texture
  }

  // 6. Industrial Metal Wall Panel Texture
  public static createWarehouseWall(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Steel slate background
    ctx.fillStyle = '#2d3340'
    ctx.fillRect(0, 0, 512, 512)

    // Modular wall panels (4x4)
    const panelW = 128
    const panelH = 128
    for (let x = 0; x < 512; x += panelW) {
      for (let y = 0; y < 512; y += panelH) {
        ctx.fillStyle = '#353c4b'
        ctx.fillRect(x + 3, y + 3, panelW - 6, panelH - 6)

        // Seam groove
        ctx.strokeStyle = '#1b1f26'
        ctx.lineWidth = 3
        ctx.strokeRect(x + 1, y + 1, panelW - 2, panelH - 2)

        // Screws in corners of panel
        ctx.fillStyle = '#101217'
        const screwPad = 10
        ctx.beginPath()
        ctx.arc(x + screwPad, y + screwPad, 2.5, 0, Math.PI * 2)
        ctx.arc(x + panelW - screwPad, y + screwPad, 2.5, 0, Math.PI * 2)
        ctx.arc(x + screwPad, y + panelH - screwPad, 2.5, 0, Math.PI * 2)
        ctx.arc(x + panelW - screwPad, y + panelH - screwPad, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Top warning band
    for (let x = -40; x < 550; x += 40) {
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 20, 0)
      ctx.lineTo(x + 40, 24)
      ctx.lineTo(x + 20, 24)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(6, 2)
    return texture
  }

  // 7. Metal Grate Catwalk Texture
  public static createMetalCatwalk(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#1e232a'
    ctx.fillRect(0, 0, 256, 256)

    // Diamond steel grating pattern
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    const step = 16
    for (let x = -256; x < 512; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 256, 256)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x + 256, 0)
      ctx.lineTo(x, 256)
      ctx.stroke()
    }

    // Yellow safety edges on sides
    ctx.fillStyle = '#eab308'
    ctx.fillRect(0, 0, 16, 256)
    ctx.fillRect(256 - 16, 0, 16, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 10)
    return texture
  }
}
