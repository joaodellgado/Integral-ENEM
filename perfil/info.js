(async () => {
  const fileInput = document.getElementById("profile-photo-input");
  const uploadBtn = document.getElementById("avatar-upload-btn");
  const avatarImg = document.getElementById("profile-avatar");
  const avatarDeleteBtn = document.getElementById("avatar-delete-btn");
  const nameInput = document.getElementById("profile-name");
  const nameDisplay = document.getElementById("profile-name-display");
  const nameCount = document.getElementById("name-count");
  const previewImg = document.getElementById("preview-avatar-img");
  const resetBtn = document.getElementById("reset-profile");
  const saveBtn = document.getElementById("save-profile");
  const zoomRange = document.getElementById("zoom-range");
  const zoomIn = document.getElementById("zoom-in");
  const zoomOut = document.getElementById("zoom-out");
  const avatarFrame = document.querySelector(".avatar-frame");
  const zoomControls = document.getElementById("zoom-controls");
  const pendingHint = document.getElementById("pending-hint");
  const fileWarning = document.getElementById("file-warning");
  const navbarAvatar = document.querySelector(".user-avatar img");

  const supabaseClient = window.supabaseClient;
  const BUCKET = "admin-avatars";
  const DEFAULT_AVATAR = "/imagens/default-avatar.png";
  const defaultTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  const normalizeAvatarPath = (path) => {
    if (!path) return null;
    let cleaned = String(path).trim().replace(/\\/g, "/");
    cleaned = cleaned.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(public|sign)\/admin-avatars\//, "");
    cleaned = cleaned.replace(/^admin-avatars\//, "");
    cleaned = cleaned.replace(/^\/+/, "");
    return cleaned || null;
  };
  let currentScale = 1;
  let currentAvatarPath = null;
  let offsetX = 0;
  let offsetY = 0;
  const dragState = { active: false, startX: 0, startY: 0, frameW: 0, frameH: 0, baseX: 0, baseY: 0 };
  let pendingFile = null;
  let pendingDelete = false;
  let lastFinalUrl = null;
  let dirtyTransform = false;
  const cache = window.profileCache || { load: () => null, save: () => {} };

  function saveProfileCache(data) {
    cache.save(data);
  }

  function updateTransformCache() {
    const cached = cache.load() || {};
    saveProfileCache({
      name: cached.name || nameInput?.value || "Administrador",
      avatarPath: cached.avatarPath ?? currentAvatarPath,
      avatarUrl: cached.avatarUrl ?? avatarImg?.src ?? DEFAULT_AVATAR,
      transform: { scale: currentScale, offsetX, offsetY },
      pending: true,
    });
  }

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => fileInput.click());
  }

  async function resolveAvatarUrl(path) {
    if (path && (String(path).startsWith("http://") || String(path).startsWith("https://"))) {
      return path;
    }
    const normalizedPath = normalizeAvatarPath(path);
    if (!normalizedPath || !supabaseClient) return DEFAULT_AVATAR;
    try {
      // Tenta URL assinada (funciona com bucket privado); cai no publicUrl se falhar
      const { data, error } = await supabaseClient.storage.from(BUCKET).createSignedUrl(normalizedPath, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (_) {
      /* noop */
    }
    try {
      const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(normalizedPath);
      return data?.publicUrl || DEFAULT_AVATAR;
    } catch (_) {
      return DEFAULT_AVATAR;
    }
  }

  async function hydrateProfile() {
    const cached = cache.load();
    const name = cached?.name || "Administrador";
    const avatarUrl = cached?.avatarUrl || DEFAULT_AVATAR;
    const cachedTransform = cached?.transform || defaultTransform;
    currentAvatarPath = cached?.avatarPath || null;

    if (avatarImg) avatarImg.src = avatarUrl;
    if (previewImg) previewImg.src = avatarUrl;
    if (navbarAvatar && !cached?.pending) navbarAvatar.src = avatarUrl;
    if (nameInput) nameInput.value = cached?.name || "";
    updateNamePreview(name);

    dirtyTransform = !!cached?.pending;
    applyTransform(cachedTransform.scale, cachedTransform.offsetX, cachedTransform.offsetY);
    if (!cached?.pending) applyNavbarTransform(cachedTransform);
    dirtyTransform = false;
    pendingDelete = false;
    pendingFile = null;
    if (pendingHint) pendingHint.style.display = cached?.pending ? "block" : "none";

    if (!supabaseClient) return { user: null, avatarPath: currentAvatarPath };

    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr || !authData?.user) return { user: null, avatarPath: currentAvatarPath };

    // Não sobrescreve se há alterações pendentes locais
    if (cached?.pending) return { user: authData.user, avatarPath: currentAvatarPath };

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("nome, avatar_url, avatar_transform")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) return { user: authData.user, avatarPath: currentAvatarPath };

    const profileName = profile?.nome || name;
    const avatarPath = normalizeAvatarPath(profile?.avatar_url) || null;
    const dbTransform = avatarPath ? profile?.avatar_transform || defaultTransform : defaultTransform;

    let finalUrl = DEFAULT_AVATAR;
    if (avatarPath) {
      currentAvatarPath = avatarPath;
      finalUrl = await resolveAvatarUrl(avatarPath);
    } else {
      currentAvatarPath = null;
    }

    if (avatarImg) avatarImg.src = finalUrl;
    if (previewImg) previewImg.src = finalUrl;
    if (navbarAvatar) navbarAvatar.src = finalUrl;
    if (nameInput) nameInput.value = profileName || "";
    updateNamePreview(profileName || "Administrador");

    applyTransform(dbTransform.scale, dbTransform.offsetX, dbTransform.offsetY);
    applyNavbarTransform(dbTransform);

    dirtyTransform = false;
    pendingDelete = false;
    pendingFile = null;
    if (pendingHint) pendingHint.style.display = "none";

    saveProfileCache({
      name: profileName || "Administrador",
      avatarPath: currentAvatarPath,
      avatarUrl: finalUrl,
      transform: currentAvatarPath ? dbTransform : defaultTransform,
      pending: false,
    });

    return { user: authData.user, avatarPath: currentAvatarPath };
  }

  function updateNamePreview(value) {
    if (nameDisplay) nameDisplay.textContent = value.trim() || "Administrador";
    if (nameCount) nameCount.textContent = `${Math.min(value.length, 60)}/60`;
  }

  function clampOffset(scale, val) {
    const maxOffset = Math.max(0, (scale - 1) * 50); // mantém imagem visível
    return Math.min(Math.max(val, -maxOffset), maxOffset);
  }

  function applyTransform(scale = currentScale, x = offsetX, y = offsetY) {
    currentScale = Math.min(Math.max(scale, 1), 1.8);
    offsetX = clampOffset(currentScale, x);
    offsetY = clampOffset(currentScale, y);
    if (avatarImg) avatarImg.style.transform = `translate3d(${offsetX}%, ${offsetY}%, 0) scale(${currentScale})`;
    if (previewImg) previewImg.style.transform = `translate3d(${offsetX}%, ${offsetY}%, 0) scale(${currentScale})`;
    if (zoomRange) zoomRange.value = currentScale;
    if (zoomControls) {
      zoomControls.style.display = currentAvatarPath || pendingFile ? "flex" : "none";
    }
    if (avatarDeleteBtn) {
      avatarDeleteBtn.style.display = currentAvatarPath || pendingFile ? "inline-flex" : "none";
    }
    if (pendingHint) pendingHint.style.display = (pendingDelete || pendingFile || dirtyTransform) ? "block" : "none";
  }

  function applyNavbarTransform(transform) {
    if (!navbarAvatar) return;
    const scale = Math.min(Math.max(transform?.scale ?? 1, 1), 1.8);
    const x = clampOffset(scale, transform?.offsetX ?? 0);
    const y = clampOffset(scale, transform?.offsetY ?? 0);
    navbarAvatar.style.objectFit = "cover";
    navbarAvatar.style.transformOrigin = "center";
    navbarAvatar.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${scale})`;
  }

  if (nameInput) {
    updateNamePreview(nameInput.value || "");
    nameInput.addEventListener("input", (e) => updateNamePreview(e.target.value));
  }

  if (fileInput && avatarImg) {
    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const allowedTypes = new Set(["image/jpeg", "image/png"]);
      if (!allowedTypes.has(file.type)) {
        if (fileWarning) {
          fileWarning.textContent = "Formato não permitido. Use JPG ou PNG.";
          fileWarning.style.display = "block";
        }
        fileInput.value = "";
        return;
      }
      if (fileWarning) fileWarning.style.display = "none";
      if (file.size > 5 * 1024 * 1024) {
        alert("Use uma imagem de até 5MB.");
        return;
      }

      pendingFile = file; // armazena para upload apenas no salvar

      // Preview local imediato
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarImg.src = e.target?.result || avatarImg.src;
        if (previewImg) previewImg.src = e.target?.result || avatarImg.src;
        applyTransform(1, 0, 0);
      };
      reader.readAsDataURL(file);

      // Aplica zoom visível e limpa marca de delete
      pendingDelete = false;
      dirtyTransform = true;
      if (pendingHint) pendingHint.style.display = "block";
      // Ao trocar foto, zera cache de transform
      const cached = cache.load() || {};
      saveProfileCache({
        name: cached.name || nameInput?.value || "Administrador",
        avatarPath: cached.avatarPath ?? currentAvatarPath,
        avatarUrl: e.target?.result || avatarImg?.src || DEFAULT_AVATAR,
        transform: { scale: currentScale, offsetX, offsetY },
        pending: true,
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const confirmReset = window.confirm("Deseja limpar a foto e definir o nome para 'Indefinido'?");
      if (!confirmReset) return;

      if (avatarImg) avatarImg.src = DEFAULT_AVATAR;
      if (previewImg) previewImg.src = DEFAULT_AVATAR;
      const navbarAvatar = document.querySelector(".user-avatar img");
      if (navbarAvatar) navbarAvatar.src = DEFAULT_AVATAR;
      if (nameInput) {
        nameInput.value = "Indefinido";
      }
      updateNamePreview("Indefinido");
      if (fileInput) fileInput.value = "";
      applyTransform(1, 0, 0);
      pendingFile = null;
      pendingDelete = true;
      dirtyTransform = true;
      currentAvatarPath = null;
      if (pendingHint) pendingHint.style.display = "block";
      const cached = cache.load() || {};
      saveProfileCache({
        name: cached.name || "Administrador",
        avatarPath: cached.avatarPath ?? null,
        avatarUrl: DEFAULT_AVATAR,
        transform: { scale: 1, offsetX: 0, offsetY: 0 },
        pending: true,
      });
    });
  }

  if (saveBtn && supabaseClient) {
    saveBtn.addEventListener("click", async () => {
      const cached = cache.load() || {};

      const { data: authData } = await supabaseClient.auth.getUser();
      if (!authData?.user) {
        alert("Faça login para salvar.");
        return;
      }
      const trimmed = (nameInput?.value || "").trim();
      if (!trimmed) {
        alert("Digite um nome para salvar.");
        return;
      }

    const cachedTransform = cached.transform || defaultTransform;
      const hasNameChange = trimmed !== (cached.name || "");
      const hasAvatarChange = pendingFile || pendingDelete || (currentAvatarPath || null) !== (cached.avatarPath || null);
      const hasTransformChange =
        dirtyTransform ||
        currentScale !== (cachedTransform.scale ?? 1) ||
        offsetX !== (cachedTransform.offsetX ?? 0) ||
        offsetY !== (cachedTransform.offsetY ?? 0);

      if (!hasNameChange && !hasAvatarChange && !hasTransformChange) {
        alert("Você não fez nenhuma alteração.");
        return;
      }

      let avatarPathToSave = currentAvatarPath;

      if (pendingDelete && !pendingFile) {
        avatarPathToSave = null;
        currentAvatarPath = null;
        // Reset transforms ao remover avatar
        currentScale = 1;
        offsetX = 0;
        offsetY = 0;
      } else if (pendingFile) {
        const ext = (pendingFile.name.split(".").pop() || "png").toLowerCase();
        avatarPathToSave = `${authData.user.id}/avatar.${ext}`;

        const { error: uploadErr } = await supabaseClient.storage
          .from(BUCKET)
          .upload(avatarPathToSave, pendingFile, {
            upsert: true,
            contentType: pendingFile.type || "image/png",
            cacheControl: "3600",
          });

        if (uploadErr) {
          console.error("[Perfil] Erro ao enviar avatar:", uploadErr);
          alert("Não foi possível enviar a imagem. Tente novamente.");
          return;
        }

        currentAvatarPath = avatarPathToSave;
        pendingFile = null;
        pendingDelete = false;
      }

      const transformToPersist = avatarPathToSave ? { scale: currentScale, offsetX, offsetY } : null;

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ nome: trimmed, avatar_url: avatarPathToSave || null, avatar_transform: transformToPersist })
        .eq("id", authData.user.id);

      if (updateError) {
        console.error("[Perfil] Erro ao salvar perfil:", updateError);
        alert("Não foi possível salvar. Tente novamente.");
        return;
      }

      const finalUrl = await resolveAvatarUrl(avatarPathToSave);
      if (avatarImg) avatarImg.src = finalUrl;
      if (previewImg) previewImg.src = finalUrl;
      if (navbarAvatar) {
        navbarAvatar.src = finalUrl;
        applyNavbarTransform(transformToPersist || defaultTransform);
      }

      lastFinalUrl = finalUrl;
      pendingDelete = false;
      pendingFile = null;
      dirtyTransform = false;
      if (pendingHint) pendingHint.style.display = "none";

      saveProfileCache({
        name: trimmed,
        avatarPath: avatarPathToSave,
        avatarUrl: avatarPathToSave ? finalUrl : DEFAULT_AVATAR,
        transform: avatarPathToSave ? transformToPersist || defaultTransform : defaultTransform,
        pending: false,
      });
      alert("Visual salvo (nome e avatar). Recarregando página...");
      setTimeout(() => window.location.reload(), 200);
    });
  }

  // Lixeira para remover avatar e limpar avatar_url
  if (avatarDeleteBtn) {
    avatarDeleteBtn.addEventListener("click", async () => {
      if (!currentAvatarPath && !pendingFile) {
        alert("Você já está sem avatar.");
        return;
      }

      const confirmRemoval = window.confirm("Tem certeza que deseja remover sua foto?");
      if (!confirmRemoval) return;

      // Marca remoção para efetivar só no "Salvar visual"
      pendingDelete = true;
      pendingFile = null;

      // Remove apenas da visualização atual
      if (avatarImg) avatarImg.src = DEFAULT_AVATAR;
      if (previewImg) previewImg.src = DEFAULT_AVATAR;
      // navbar permanece com a última imagem salva
      applyTransform(1, 0, 0);
      dirtyTransform = true;
      // limpa transform no cache ao marcar remoção
      saveProfileCache({
        name: nameInput?.value || "Administrador",
        avatarPath: currentAvatarPath,
        avatarUrl: DEFAULT_AVATAR,
        transform: { scale: 1, offsetX: 0, offsetY: 0 },
        pending: true,
      });

      // Sem alerta extra de pendência; a UI já mostra o aviso
    });
  }

  // Zoom controls
  if (zoomRange) {
    zoomRange.addEventListener("input", (e) => {
      dirtyTransform = true;
      applyTransform(parseFloat(e.target.value || "1"), offsetX, offsetY);
      if (pendingHint) pendingHint.style.display = "block";
      updateTransformCache();
    });
  }

  if (zoomIn) {
    zoomIn.addEventListener("click", () => {
      dirtyTransform = true;
      applyTransform(currentScale + 0.1, offsetX, offsetY);
      if (pendingHint) pendingHint.style.display = "block";
      updateTransformCache();
    });
  }
  if (zoomOut) {
    zoomOut.addEventListener("click", () => {
      dirtyTransform = true;
      applyTransform(currentScale - 0.1, offsetX, offsetY);
      if (pendingHint) pendingHint.style.display = "block";
      updateTransformCache();
    });
  }

  // Drag-to-position
  function getPoint(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(e) {
    if (!avatarFrame) return;
    const { x, y } = getPoint(e);
    const rect = avatarFrame.getBoundingClientRect();
    dragState.active = true;
    dragState.startX = x;
    dragState.startY = y;
    dragState.frameW = rect.width || 1;
    dragState.frameH = rect.height || 1;
    dragState.baseX = offsetX;
    dragState.baseY = offsetY;
    avatarFrame.classList.add("dragging");
  }

  function moveDrag(e) {
    if (!dragState.active) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const dx = ((x - dragState.startX) / dragState.frameW) * 100;
    const dy = ((y - dragState.startY) / dragState.frameH) * 100;
    dirtyTransform = true;
    applyTransform(currentScale, dragState.baseX + dx, dragState.baseY + dy);
    if (pendingHint) pendingHint.style.display = "block";
    updateTransformCache();
  }

  function endDrag() {
    dragState.active = false;
    if (avatarFrame) avatarFrame.classList.remove("dragging");
  }

  if (avatarFrame) {
    avatarFrame.addEventListener("mousedown", startDrag);
    avatarFrame.addEventListener("touchstart", startDrag, { passive: true });
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
  }

  await hydrateProfile();
  if (pendingHint) pendingHint.style.display = "none";
})();
