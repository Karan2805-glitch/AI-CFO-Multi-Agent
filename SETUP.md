Here is the condensed list of fixes and commands to resolve your installation errors and protect your C: drive.

# . Redirect Heavy Caches to D:
Stop tools from secretly filling your C: drive. Run these in PowerShell (Administrator), then restart your terminal:

PowerShell
# Redirect UV and Pip to D:
[System.Environment]::SetEnvironmentVariable('UV_CACHE_DIR', 'D:\uv-cache', 'User')
[System.Environment]::SetEnvironmentVariable('PIP_CACHE_DIR', 'D:\AI_Caches\pip', 'User')
2. Fix the uv Command (PATH)
The uv command is not recognized because it is in a version-specific folder. 
# Imp Add this exact path to your Windows Environment Variables (User Path):

3. Solve the Build Error (Downgrade to 3.12)
Python 3.14 is too new and lacks pre-compiled "Wheels," forcing a build that your system cannot handle. Use uv to create a stable 3.12 environment on your D: drive:

PowerShell
# 1. Navigate to your project on D:
cd D:\Projects\AI-CFO-Multi-Agent\backend\app

# 2. Delete the broken 3.14 environment
deactivate
rm -Recurse -Force .venv
# 3. Create a stable 3.12 environment (uv will download it for you)
uv venv --python 3.12

# 4. Activate and Install (Now using fast, pre-built binaries)
.\.venv\Scripts\activate
uv pip install -r req.txt
4. Immediate C: Drive Cleanup

Delete failed UV cache: rm -Recurse -Force C:\Users\amrit\AppData\Local\uv\cache

Delete Pip temp files: Press Win + R, type %temp%, and delete all contents.