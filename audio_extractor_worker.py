import ffmpeg
import os

def audio_extractor(input_path, output_folder = "files"):
    if not os.path.isfile(input_path):
        raise FileNotFoundError("Input File Not Found")

    os.makedirs(output_folder, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    audio_output = os.path.join(output_folder, f"{base_name}_audio.mp3")
    video_output = os.path.join(output_folder, f"{base_name}_video.mp4")

    source = ffmpeg.input(input_path)

    try:
        source.audio.output(audio_output, acodec = "libmp3lame", audio_bitrate="192k").overwrite_output().run(quiet=True)
    except ffmpeg.Error as e:
        raise RuntimeError(f"Audio Extraction Failed: {e.stderr.decode(errors='ignore')}")

    
    try:
        source.video.output(video_output, vcodec = "copy").overwrite_output().run(quiet=True)
    except ffmpeg.Error as e:
        raise RuntimeError(f"Video Extraction Failed: {e.stderr.decode(errors='ignore')}")

    return audio_output, video_output



if __name__ == "__main__":
    audio_path, video_path = audio_extractor('./files/source.mp4')
    print(f"Audio Saved : {audio_path}")
    print(f"Video Saved : {video_path}")
