import numpy
import json
import os

simType=["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]
nSims=len(simType)

modType=["Basic", "Std", "Improved", "Best"]
nMods=len(modType)


metaData={}
header = {}
header['metaDataProperties']=['Simulation type', 'Model type']
header['dataProperties']=['Average f', 'Std dev f']
metaData['header']=header
metaData['data']=[]


ndsets=100

nx=3
ny=21
nz=21

xv=numpy.linspace(0.,1.,nx)
yv=numpy.linspace(0.,1.,ny) 
zv=numpy.linspace(0.,1.,nz)
[z,y,x]=numpy.meshgrid(zv,yv,xv,indexing='ij')

r2=(y-0.5)**2 + (z-0.5)**2
shape=numpy.exp(-10*r2)

inletf=numpy.random.random(ndsets)
exitf=numpy.random.random(ndsets)
peak=numpy.random.random(ndsets)

background = numpy.zeros(nx)

dir_name_root = "case_"

for n in range(ndsets):
    background=x*(exitf[n]-inletf[n]) + inletf[n]
    f=background + peak[n]*shape
    ave=numpy.mean(f)
    std=numpy.std(f)
    datum={}
    datum["taskId"]=n
    datum["Simulation type"]=simType[numpy.random.randint(nSims)]
    datum["Model type"]=modType[numpy.random.randint(nMods)]
    datum["Average f"]=ave
    datum["Std dev f"]=std
    datum["label"] = "Box "+str(n)
    metaData["data"].append(datum)

    os.mkdir(dir_name_root+str(n))
    os.chdir(dir_name_root+str(n))
    zmid=(nz-1)/2
    points = []
    for i in range(ny):
        point={}
        point["x"]=y[zmid,i,0]
        point["y"]=f[zmid,i,0]
        points.append(point)
    fname="f_line_xstart.json"
    with open(fname, 'w') as outfile:
        json.dump(points, outfile)

    points = []
    for i in range(ny):
        point={}
        point["x"]=y[zmid,i,1]
        point["y"]=f[zmid,i,1]
        points.append(point)
    fname="f_line_xmid.json"
    with open(fname, 'w') as outfile:
        json.dump(points, outfile)

    points = []
    for i in range(ny):
        point={}
        point["x"]=y[zmid,i,2]
        point["y"]=f[zmid,i,2]
        points.append(point)
    fname="f_line_xend.json"
    with open(fname, 'w') as outfile:
        json.dump(points, outfile)


    xsurf=[]
    ysurf=[]
    vsurf=[]
    for k in range(nz):
        for j in range(ny):
            xsurf.append(y[k,j,0])
            ysurf.append(z[k,j,0])
            vsurf.append(f[k,j,0])
    dataout={}
    surface={}
    surface["x"]=xsurf
    surface["y"]=ysurf
    surface["v"]=vsurf
    surface["size"]=[ny,nz]
    dataout["surfaces"]=[]
    dataout["surfaces"].append(surface)
    fname="f_area2d_xstart.json"
    with open(fname, 'w') as outfile:
        json.dump(dataout, outfile)



    dataout={}
    dataout["surfaces"]=[]
    xsurf=[]
    ysurf=[]
    zsurf=[]
    vsurf=[]
    for k in range(nz):
        for j in range(ny):
            xsurf.append(x[k,j,0])
            ysurf.append(y[k,j,0])
            zsurf.append(z[k,j,0])
            vsurf.append(f[k,j,0])
    surface={}
    surface["x"]=xsurf
    surface["y"]=ysurf
    surface["z"]=zsurf
    surface["v"]=vsurf
    surface["size"]=[ny,nz]
    dataout["surfaces"].append(surface)
    xsurf=[]
    ysurf=[]
    zsurf=[]
    vsurf=[]
    for k in range(nz):
        for j in range(ny):
            xsurf.append(x[k,j,1])
            ysurf.append(y[k,j,1])
            zsurf.append(z[k,j,1])
            vsurf.append(f[k,j,1])
    surface={}
    surface["x"]=xsurf
    surface["y"]=ysurf
    surface["z"]=zsurf
    surface["v"]=vsurf
    surface["size"]=[ny,nz]
    dataout["surfaces"].append(surface)
    xsurf=[]
    ysurf=[]
    zsurf=[]
    vsurf=[]
    for k in range(nz):
        for j in range(ny):
            xsurf.append(x[k,j,2])
            ysurf.append(y[k,j,2])
            zsurf.append(z[k,j,2])
            vsurf.append(f[k,j,2])
    surface={}
    surface["x"]=xsurf
    surface["y"]=ysurf
    surface["z"]=zsurf
    surface["v"]=vsurf
    surface["size"]=[ny,nz]
    dataout["surfaces"].append(surface)


    fname="f_area3d.json"
    with open(fname, 'w') as outfile:
        json.dump(dataout, outfile)

    os.chdir("..")





with open('metaData.json', 'w') as outfile:
    json.dump(metaData, outfile)





