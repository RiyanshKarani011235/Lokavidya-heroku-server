# install dependencies
echo "--------------------------------------------"
echo "--------- installing dependencies ----------"
echo "--------------------------------------------"
yum install autoconf
yum install automake
yum install bzip2
yum install make
yum install freetype-devel
yum install gcc
yum install gcc-c++
yum install git
yum install lib tool 
yum install make
yum install mercurial
yum install nasm
yum install pkgconfig
yum install zlib-devel

# create temp directory
mkdir /tmp/ffmpegsources

# install yams
echo "--------------------------------------------"
echo "------------- installing yams --------------"
echo "--------------------------------------------"
cd /tmp/ffmpegsources
git clone --depth 1 git://github.com/yasm/yasm.git
cd yasm
autoreconf -fiv
./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin"
make
make install
echo

echo "--------------------------------------------"
echo "------------ installing libx264 ------------"
echo "--------------------------------------------"
# install libx264
cd /tmp/ffmpegsources
git clone --depth 1 git://git.videolan.org/x264
cd x264
PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" --enable-static
make
make install
echo

echo "--------------------------------------------"
echo "------------ installing libx265 ------------"
echo "--------------------------------------------"
# install libx265
cd /tmp/ffmpegsources
hg clone https://bitbucket.org/multicoreware/x265
cd ~/ffmpeg_sources/x265/build/linux
cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX="$HOME/ffmpeg_build" -DENABLE_SHARED:bool=off ../../source
make
make install
echo

echo "--------------------------------------------"
echo "---------- installing libfdk_aac -----------"
echo "--------------------------------------------"
# install libfdk_aac
cd /tmp/ffmpegsources
git clone --depth 1 git://git.code.sf.net/p/opencore-amr/fdk-aac
cd fdk-aac
autoreconf -fiv
./configure --prefix="$HOME/ffmpeg_build" --disable-shared
make
make install
echo

echo "--------------------------------------------"
echo "---------- installing libmp3lame -----------"
echo "--------------------------------------------"
# install libmp3lame
cd /tmp/ffmpegsources
curl -L -O http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz
tar xzvf lame-3.99.5.tar.gz
cd lame-3.99.5
./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" --disable-shared --enable-nasm
make
make install
echo

echo "--------------------------------------------"
echo "------------ installing libopus ------------"
echo "--------------------------------------------"
# install lib opus
cd /tmp/ffmpegsources
git clone http://git.opus-codec.org/opus.git
cd opus
autoreconf -fiv
PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure --prefix="$HOME/ffmpeg_build" --disable-shared
make
make install
echo

echo "--------------------------------------------"
echo "--------- installing dependencies ----------"
echo "--------------------------------------------"
# install libogg
cd /tmp/ffmpegsources
curl -O http://downloads.xiph.org/releases/ogg/libogg-1.3.2.tar.gz
tar xzvf libogg-1.3.2.tar.gz
cd libogg-1.3.2
./configure --prefix="$HOME/ffmpeg_build" --disable-shared
make
make install
echo

echo "--------------------------------------------"
echo "---------- installing libvorbis ------------"
echo "--------------------------------------------"
# install libvorbis
cd /tmp/ffmpegsources
curl -O http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.4.tar.gz
tar xzvf libvorbis-1.3.4.tar.gz
cd libvorbis-1.3.4
./configure --prefix="$HOME/ffmpeg_build" --with-ogg="$HOME/ffmpeg_build" --disable-shared
make
make install
echo

echo "--------------------------------------------"
echo "------------ installing libvpx -------------"
echo "--------------------------------------------"
# install libvpx
cd /tmp/ffmpegsources
git clone --depth 1 https://chromium.googlesource.com/webm/libvpx.git
cd libvpx
./configure --prefix="$HOME/ffmpeg_build" --disable-examples
make
make install
echo

echo "--------------------------------------------"
echo "------------ installing FFMPEG -------------"
echo "--------------------------------------------"
# install FFMPEG
cd /tmp/ffmpegsources
curl -O http://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2
tar xjvf ffmpeg-snapshot.tar.bz2
cd ffmpeg
PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure --prefix="$HOME/ffmpeg_build" --extra-cflags="-I$HOME/ffmpeg_build/include" --extra-ldflags="-L$HOME/ffmpeg_build/lib -ldl" --bindir="$HOME/bin" --pkg-config-flags="--static" --enable-gpl --enable-nonfree --enable-libfdk_aac --enable-libfreetype --enable-libmp3lame --enable-libopus --enable-libvorbis --enable-libvpx --enable-libx264 --enable-libx265 --disable-yasm
make
make install
hash -r
