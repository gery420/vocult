import ffmpeg
import os

# this function is 1st step for making dubbing model
# it extracts the audio and video component from video
# and saves it for later use for other workers

def audio_extractor(input_path, output_folder = "files"):
    # determine whether the file exists, if not throw an error
    if not os.path.isfile(input_path):
        raise FileNotFoundError("Input File Not Found")

    os.makedirs(output_folder, exist_ok=True)

    # take the file name and append audio and video accordingly
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    audio_output = os.path.join(output_folder, f"{base_name}_audio.mp3")
    video_output = os.path.join(output_folder, f"{base_name}_video.mp4")

    #the source file for the ffmpeg
    source = ffmpeg.input(input_path)

    try:
        # this extracts the audio from source
        source.audio.output(audio_output, acodec = "libmp3lame", audio_bitrate="192k").overwrite_output().run(quiet=True)
    except ffmpeg.Error as e:
        #throws an error if not successful
        raise RuntimeError(f"Audio Extraction Failed: {e.stderr.decode(errors='ignore')}")

    
    try:
        #similarly, this extracts the video file from the source and
        #throws an error if, not successfull
        source.video.output(video_output, vcodec = "copy").overwrite_output().run(quiet=True)
    except ffmpeg.Error as e:
        raise RuntimeError(f"Video Extraction Failed: {e.stderr.decode(errors='ignore')}")

    return audio_output, video_output



if __name__ == "__main__":
    audio_path, video_path = audio_extractor('./files/test.mp4')
    print(f"Audio Saved : {audio_path}")
    print(f"Video Saved : {video_path}")
