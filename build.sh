#!/bin/sh

# LuCI Time Control 打包脚本
# 目标平台：OpenWrt 25.12+
# 注意：需在完整版 apk-tools 3.x 上运行；OpenWrt 25.12 路由器自带的是
#       minimal 构建，不含 mkpkg，不能直接在路由器上执行本脚本
# 产物：APK v3 包（apk-tools >= 3 的 `apk mkpkg` 格式）

set -eu

PKG_NAME="luci-app-timecontrol"
VERSION="1.3.0"
PKG_RELEASE="1"
APK_VERSION="${VERSION}-r${PKG_RELEASE}"
ARCH="noarch"
OUTPUT_NAME="${PKG_NAME}-${APK_VERSION}_all.apk"

MAINTAINER="OpenWrt Community"
DESCRIPTION="LuCI support for time-based network access control (parental control)"
DEPENDS="libc nftables kmod-nft-core luci-base rpcd"
URL="https://github.com/openwrt/luci-app-timecontrol"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APK_BIN="${APK:-apk}"

echo "Building $PKG_NAME $APK_VERSION ($ARCH) as APK..."

# ---- 环境检查 ---------------------------------------------------------------
if ! command -v "$APK_BIN" >/dev/null 2>&1; then
	echo "错误：未找到 apk-tools 3.x（可通过 APK=/path/to/apk 指定）。" >&2
	echo "OpenWrt 25.12 的 APK v3 包需要 apk mkpkg 生成，请先安装 apk-tools >= 3。" >&2
	exit 1
fi

case "$("$APK_BIN" --version 2>&1 | head -n 1)" in
	"apk-tools 3."*) ;;
	*)
		echo "错误：$APK_BIN 不是 apk-tools 3.x，无法生成 APK v3 包。" >&2
		exit 1
		;;
esac

if ! "$APK_BIN" mkpkg --help >/dev/null 2>&1; then
	echo "错误：当前 apk 不支持 mkpkg 子命令。" >&2
	echo "OpenWrt 25.12 路由器自带的是 minimal 构建，不含 mkpkg。" >&2
	echo "请在完整版 apk-tools 3.x 的 Linux 主机上运行，或用 APK=/path/to/full-apk 指定。" >&2
	exit 1
fi

FAKEROOT=""
if [ "$(id -u)" -ne 0 ]; then
	if command -v fakeroot >/dev/null 2>&1; then
		FAKEROOT="1"
	else
		echo "警告：非 root 构建，包内文件属主可能与目标设备不一致。" >&2
	fi
fi

run_apk() {
	if [ -n "$FAKEROOT" ]; then
		fakeroot -- "$APK_BIN" "$@"
	else
		"$APK_BIN" "$@"
	fi
}

sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | awk '{print $1}'
	elif command -v shasum >/dev/null 2>&1; then
		shasum -a 256 "$1" | awk '{print $1}'
	else
		echo "0000000000000000000000000000000000000000000000000000000000000000"
	fi
}

# ---- 准备暂存目录 -----------------------------------------------------------
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

ROOTFS="$TEMP_DIR/files"
SCRIPTS="$TEMP_DIR/scripts"
mkdir -p "$ROOTFS" "$SCRIPTS"

# root/ 原样映射到目标根目录；htdocs/ 映射到 /www
cp -r "$SCRIPT_DIR/root/." "$ROOTFS/"
mkdir -p "$ROOTFS/www/luci-static"
cp -r "$SCRIPT_DIR/htdocs/luci-static/." "$ROOTFS/www/luci-static/"

find "$ROOTFS" -type d -exec chmod 755 {} \;
find "$ROOTFS" -type f -exec chmod 644 {} \;
chmod 755 "$ROOTFS/etc/init.d/timecontrol" \
	"$ROOTFS/usr/libexec/rpcd/luci.timecontrol"
chmod 600 "$ROOTFS/etc/config/timecontrol"

# ---- OpenWrt APK 包元数据 ---------------------------------------------------
META_DIR="$ROOTFS/lib/apk/packages"
mkdir -p "$META_DIR"

# 先生成文件清单，避免把元数据文件自身写入清单
(cd "$ROOTFS" && find . \( -type f -o -type l \) | sed 's|^\./|/|' | LC_ALL=C sort) \
	> "$META_DIR/$PKG_NAME.list"

: > "$META_DIR/$PKG_NAME.conffiles"
: > "$META_DIR/$PKG_NAME.conffiles_static"
echo "/etc/config/timecontrol" >> "$META_DIR/$PKG_NAME.conffiles"
printf '/etc/config/timecontrol %s\n' "$(sha256_of "$ROOTFS/etc/config/timecontrol")" \
	>> "$META_DIR/$PKG_NAME.conffiles_static"
chmod 644 "$META_DIR"/*

# ---- 维护脚本（apk 命名与 ipk 不同） ----------------------------------------
cat > "$SCRIPTS/post-install" <<'EOF'
#!/bin/sh
INSTROOT="${IPKG_INSTROOT:-/}"
chmod 755 "${INSTROOT}/etc/init.d/timecontrol" \
	"${INSTROOT}/usr/libexec/rpcd/luci.timecontrol" 2>/dev/null
[ -n "${IPKG_INSTROOT}" ] && exit 0
/etc/init.d/timecontrol enable 2>/dev/null
/etc/init.d/timecontrol start 2>/dev/null
/etc/init.d/rpcd reload 2>/dev/null
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache 2>/dev/null
exit 0
EOF
cp "$SCRIPTS/post-install" "$SCRIPTS/post-upgrade"

cat > "$SCRIPTS/pre-deinstall" <<'EOF'
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] && exit 0
/etc/init.d/timecontrol stop 2>/dev/null
/etc/init.d/timecontrol disable 2>/dev/null
exit 0
EOF

cat > "$SCRIPTS/post-deinstall" <<'EOF'
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] && exit 0
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache 2>/dev/null
exit 0
EOF

chmod 755 "$SCRIPTS"/*

# ---- 生成 APK ---------------------------------------------------------------
SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-0}"
export SOURCE_DATE_EPOCH

run_apk mkpkg \
	--info "name:$PKG_NAME" \
	--info "version:$APK_VERSION" \
	--info "description:$DESCRIPTION" \
	--info "arch:$ARCH" \
	--info "license:MIT" \
	--info "origin:$PKG_NAME" \
	--info "url:$URL" \
	--info "maintainer:$MAINTAINER" \
	--info "depends:$DEPENDS" \
	--script "post-install:$SCRIPTS/post-install" \
	--script "post-upgrade:$SCRIPTS/post-upgrade" \
	--script "pre-deinstall:$SCRIPTS/pre-deinstall" \
	--script "post-deinstall:$SCRIPTS/post-deinstall" \
	--files "$ROOTFS" \
	--output "$SCRIPT_DIR/$OUTPUT_NAME"

echo "Package built: $OUTPUT_NAME"
ls -lh "$SCRIPT_DIR/$OUTPUT_NAME"
echo "Install on OpenWrt 25.12+: apk add --allow-untrusted $OUTPUT_NAME"
